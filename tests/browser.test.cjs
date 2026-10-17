const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--disable-gpu']});
const context=await browser.newContext();const page=await context.newPage();let calls=0,mode='success',lastBody;const errors=[],missing=[],tracking=[];
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname!=='ecomile.pro') {tracking.push(url.href);return route.fulfill({status:200,contentType:'application/javascript',body:'/* QA stub: no external tracking sent */'});}
 if(url.pathname==='/.netlify/functions/contact') {calls++; const body=route.request().postDataJSON();lastBody=body; assert.equal(body.project,'mysite');assert.ok(body.name.trim());return route.fulfill({status:mode==='error'?500:200,contentType:'application/json',body:JSON.stringify({success:mode==='success'})});}
 let file=path.join(root,decodeURIComponent(url.pathname));if(url.pathname.endsWith('/')) file=path.join(file,'index.html');
 if(!fs.existsSync(file)){missing.push(url.pathname);return route.fulfill({status:404,body:'not found'});}
 const ext=path.extname(file);return route.fulfill({status:200,body:fs.readFileSync(file),contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.jpg':'image/jpeg'})[ext]||'text/plain'});
});
for(const lang of ['en','ru','vn']) for(const width of [320,390,768,1440]) {
 await page.setViewportSize({width,height:900});await page.goto(`https://ecomile.pro/${lang}/mysite/`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${lang}/${width} overflow`);
 for(const image of await page.locator('img').all()) await image.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
 assert.equal(await page.locator('#ms-social').isVisible(),true);
 assert.equal(await page.locator('h1').count(),1);
 if(width===320){
   const name=page.locator('input[name=name]'),email=page.locator('input[name=email]'),messenger=page.locator('input[name=messenger]'),submit=page.locator('button[type=submit]');
   await name.fill('QA');
   for(const [e,m,error] of [['','','required'],['   ','  ','required'],['invalid','','email'],['','random text','messenger'],['bad','@valid_user','email'],['qa@example.test','bad','messenger']]){
     const before=calls;await email.fill(e);await messenger.fill(m);await submit.click();
     assert.equal(calls,before);
     assert.equal(await page.locator('#ms-status').textContent(),await page.locator('#ms-copy').evaluate((el,key)=>JSON.parse(el.textContent).contactErrors[key],error));
   }
   for(const [e,m] of [[' qa@example.test ',''],['','@valid_user'],['','+371 2000 0000'],['qa@example.test','https://t.me/valid_user']]){
     await name.fill('QA');await email.fill(e);await messenger.fill(m);const before=calls;await submit.click();await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
     assert.equal(calls,before+1);assert.equal(lastBody.email,e.trim());assert.equal(lastBody.messenger,m);
   }
   await name.fill('QA');await email.fill('qa@example.test');
   await page.route('**/.netlify/functions/contact',r=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({success:false,code:'email'})}),{times:1});
   await submit.click();await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
   assert.equal(await page.locator('#ms-status').textContent(),await page.locator('#ms-copy').evaluate(el=>JSON.parse(el.textContent).contactErrors.email));
 }
 if(lang==='ru' && [390,1440].includes(width)){if(await page.locator('[data-consent=reject]').isVisible()) await page.locator('[data-consent=reject]').click();await page.screenshot({path:`/tmp/mysite-ru-${width}.png`,fullPage:true});}
}
console.log('PASS: 12 language/viewport combinations, no overflow, all images load');
calls=0;await page.goto('https://ecomile.pro/en/mysite/');assert.equal(tracking.length,0);
await page.locator('#ms-cookie-settings').click();await page.locator('[data-consent=accept]').click();await page.waitForFunction(()=>typeof window.trackMySiteEvent==='function');
await page.locator('input[name=name]').fill('QA');await page.locator('input[name=email]').fill('qa@example.test');
assert.equal(await page.evaluate(()=>window.dataLayer.filter(x=>x.event==='Start_Form_MySite').length),1);
await page.locator('[data-demo]').first().evaluate(el=>{el.addEventListener('click',e=>e.preventDefault());el.click();});
assert.equal(await page.evaluate(()=>window.dataLayer.filter(x=>x.event==='Click_Demo_MySite').length),1);
await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#ms-status').textContent.includes('Thank you'));
assert.equal(calls,1);assert.equal(await page.evaluate(()=>window.dataLayer.filter(x=>x.event==='Lead_Form_MySite').length),1);
mode='error';await page.locator('input[name=name]').fill('QA');await page.locator('input[name=email]').fill('qa@example.test');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#ms-status').textContent.includes('could not'));
assert.equal(await page.evaluate(()=>window.dataLayer.filter(x=>x.event==='Lead_Form_MySite').length),1);
mode='success';const before=calls;await page.locator('input[name=name]').fill('   ');await page.locator('button[type=submit]').click();assert.equal(calls,before);
await page.waitForFunction(()=>window.dataLayer.some(x=>x.event==='ViewContent_MySite_Home_7s'),{timeout:10000});
console.log('PASS: consent gates tracking; demo/form/view/lead events; failed request has no lead; whitespace rejected');
await page.locator('#ms-cookie-settings').click();await Promise.all([page.waitForEvent('load'),page.locator('[data-consent=reject]').click()]);
assert.equal(await page.evaluate(()=>window.ecomileTrackingAllowed()),false);assert.equal(await page.evaluate(()=>typeof window.trackMySiteEvent),'undefined');
const after=tracking.length;await page.reload();await page.waitForTimeout(100);assert.equal(tracking.length,after);
console.log('PASS: revoke reload, rejection survives reload, no further tracking scripts');
for(const lang of ['en','ru','vn']){await page.goto(`https://ecomile.pro/${lang}/`);const link=page.locator(`.products .product a[href='/${lang}/mysite/']`);assert.equal(await link.count(),1);}
assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS: homepage product cards, JS errors=0, missing resources=0');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
