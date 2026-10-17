const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(__dirname + '/../netlify/functions/contact.js', 'utf8');
function fixture({configured=true, fail=false}={}) {
  const rows=[], notices=[];
  const google = {auth:{GoogleAuth:class {async getClient(){return {};}}}, sheets:()=>({spreadsheets:{values:{append:async request=>{if(fail) throw Error('private failure'); rows.push(request); return {};}}}})};
  const context = {require:id=>id==='googleapis'?{google}:require('../assets/js/mysite-contact.js'), exports:{}, process:{env:{SHEETS_CONFIG:JSON.stringify(configured?{mysite:'test-sheet',ea:'existing-sheet'}:{}), GOOGLE_SERVICE_ACCOUNT:'{}'}}, console:{error(){}}, fetch:async(_,options)=>{notices.push(JSON.parse(options.body));return {ok:true};}};
  vm.runInNewContext(code,context);
  return {rows,notices,send:body=>context.exports.handler({httpMethod:'POST',body:JSON.stringify(body)})};
}
test('MY SITE trims required fields, stores RAW and reports success after append',async()=>{
  const f=fixture();const response=await f.send({project:'mysite',name:' Test ',contact:' mail@example.test ',message:'=FORMULA()'});
  assert.equal(response.statusCode,200);assert.equal(f.rows.length,1);assert.equal(f.rows[0].valueInputOption,'RAW');assert.equal(f.rows[0].requestBody.values[0][1],'Test');assert.match(f.notices[0].text,/MY SITE/);
});
test('whitespace, object fields and oversized strings cannot be stored',async()=>{
  for(const body of [{name:'  ',contact:'x'},{name:'x',contact:'   '},{name:{},contact:'x'},{name:'x'.repeat(121),contact:'x'}]){
    const f=fixture();assert.equal((await f.send({project:'mysite',...body})).statusCode,400);assert.equal(f.rows.length,0);assert.equal(f.notices.length,0);
  }
});
test('missing config and failed append never produce success or Telegram notification',async()=>{
  for(const options of [{configured:false},{fail:true}]){
    const f=fixture(options);const res=await f.send({project:'mysite',name:'x',contact:'qa@example.test'});assert.equal(res.statusCode,500);assert.equal(JSON.parse(res.body).success,false);assert.doesNotMatch(res.body,/private failure|Unknown project/);assert.equal(f.notices.length,0);
  }
});
test('existing EasyAds schema and USER_ENTERED behavior are preserved',async()=>{
  const f=fixture();const response=await f.send({project:'ea',name:'Legacy',contact:'test'});assert.equal(response.statusCode,200);assert.equal(f.rows[0].valueInputOption,'USER_ENTERED');assert.equal(f.rows[0].spreadsheetId,'existing-sheet');
});

test('MY SITE accepts email or messenger, rejects missing or invalid supplied fields before side effects',async()=>{
  const cases=[
    [{email:'',messenger:''},400], [{email:'   ',messenger:'  '},400],
    [{email:' qa@example.test ',messenger:''},200],
    [{email:'',messenger:' @valid_user '},200],
    [{email:'',messenger:'https://t.me/valid_user'},200],
    [{email:'',messenger:'+371 2000 0000'},200],
    [{email:'',messenger:'https://wa.me/37120000000'},200],
    [{email:'qa@example.test',messenger:'@valid_user'},200],
    [{email:'bad',messenger:''},400], [{email:'a@b',messenger:''},400],
    [{email:'a..b@example.test',messenger:''},400],
    [{email:'',messenger:'write to me'},400],
    [{email:'',messenger:'12345'},400], [{email:'',messenger:'@abc'},400],
    [{email:'bad',messenger:'@valid_user'},400],
    [{email:'qa@example.test',messenger:'bad'},400],
    [{email:{},messenger:''},400],
    [{email:'',messenger:'https://t.me.evil.test/valid_user'},400],
    [{email:'',messenger:'https://t.me/+invite'},400],
    [{email:'',messenger:'https://wa.me/00000'},400],
    [{email:'',messenger:'https://example.com'},400],
    [{contact:'qa@example.test'},200], [{contact:'@valid_user'},200],
    [{contact:'arbitrary text'},400],
    [{email:'',messenger:'',contact:'qa@example.test'},400]
  ];
  for(const [fields,expected] of cases){
    const f=fixture();const res=await f.send({project:'mysite',name:'QA',...fields});
    assert.equal(res.statusCode,expected,JSON.stringify(fields));
    assert.equal(f.rows.length,expected===200?1:0);
    assert.equal(f.notices.length,expected===200?1:0);
    if(expected===200 && fields.email && fields.messenger){
      assert.equal(f.rows[0].requestBody.values[0][2],'qa@example.test · @valid_user');
      assert.equal(f.rows[0].requestBody.values[0].length,6);
    }
  }
});
