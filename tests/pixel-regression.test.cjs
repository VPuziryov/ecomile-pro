const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(__dirname+'/../assets/js/pixel.js','utf8');
function run(page,allowed=true){
 const tasks=[];
 const context={document:{body:{dataset:{page}},createElement:()=>({}),getElementsByTagName:()=>[{parentNode:{insertBefore(){}}}],querySelectorAll:()=>[],addEventListener(){}},setTimeout:fn=>tasks.push(fn),ecomileTrackingAllowed:()=>allowed};
 context.window=context;vm.runInNewContext(code,context);return {context,tasks,revoke:()=>{allowed=false;}};
}
test('existing product view and lead events retain their names',()=>{
 for(const [page,view,lead] of [['easyads-contact','ViewContent_EasyAds_Contact_7s','Lead_Form_EasyAds'],['easyads-asia-contact','ViewContent_EasyAds_Asia_Contact_7s','Lead_Form_EasyAds_Asia'],['diveads-contact','ViewContent_DiveAds_Contact_7s','Lead_Form_DiveAds']]){
  const {context:c,tasks}=run(page);tasks.forEach(fn=>fn());c.trackLead();const q=JSON.stringify(c.fbq.queue);assert.ok(q.includes(view));assert.ok(q.includes(lead));
 }
});
test('MY SITE refuses loading without consent and suppresses delayed events on revocation',()=>{
 const denied=run('mysite-home',false);assert.equal(denied.context.fbq,undefined);
 const f=run('mysite-home');f.context.trackMySiteEvent('demo');f.context.trackMySiteEvent('formStart');f.context.trackMySiteEvent('lead');
 assert.ok(JSON.stringify(f.context.fbq.queue).includes('Click_Demo_MySite'));
 const before=f.context.fbq.queue.length;f.revoke();f.tasks.forEach(fn=>fn());f.context.trackMySiteEvent('lead');f.context.trackLead();assert.equal(f.context.fbq.queue.length,before);
});
