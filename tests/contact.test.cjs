const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(__dirname + '/../netlify/functions/contact.js', 'utf8');
function fixture({configured=true, fail=false}={}) {
  const rows=[], notices=[];
  const google = {auth:{GoogleAuth:class {async getClient(){return {};}}}, sheets:()=>({spreadsheets:{values:{append:async request=>{if(fail) throw Error('private failure'); rows.push(request); return {};}}}})};
  const context = {require:()=>({google}), exports:{}, process:{env:{SHEETS_CONFIG:JSON.stringify(configured?{mysite:'test-sheet',ea:'existing-sheet'}:{}), GOOGLE_SERVICE_ACCOUNT:'{}'}}, console:{error(){}}, fetch:async(_,options)=>{notices.push(JSON.parse(options.body));return {ok:true};}};
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
    const f=fixture(options);const res=await f.send({project:'mysite',name:'x',contact:'x'});assert.equal(res.statusCode,500);assert.equal(JSON.parse(res.body).success,false);assert.doesNotMatch(res.body,/private failure|Unknown project/);assert.equal(f.notices.length,0);
  }
});
test('existing EasyAds schema and USER_ENTERED behavior are preserved',async()=>{
  const f=fixture();const response=await f.send({project:'ea',name:'Legacy',contact:'test'});assert.equal(response.statusCode,200);assert.equal(f.rows[0].valueInputOption,'USER_ENTERED');assert.equal(f.rows[0].spreadsheetId,'existing-sheet');
});
