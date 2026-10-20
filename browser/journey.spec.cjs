const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const day=(offset)=>{const d=new Date();d.setUTCHours(12,0,0,0);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);};
for(const [mode,url] of [['express','http://127.0.0.1:3000'],['static','http://127.0.0.1:8090']]){
test(`${mode}: valid booking, validation, persistence, reset and mobile`,async({page})=>{
  test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('verification/screenshots',{recursive:true});
  const shot=async name=>{if(mode==='static')await page.screenshot({path:`verification/screenshots/${name}.jpg`,type:'jpeg',quality:82,fullPage:true});};
  await page.goto(url);await expect(page.getByRole('heading',{level:1})).toContainText('Come for the city');await shot('homepage');
  await page.goto(url+'/#confirmation');await expect(page.locator('#error')).toContainText('Complete the review');
  await page.getByLabel('Check-in',{exact:true}).fill(day(30));await page.getByLabel('Check-out',{exact:true}).fill(day(30));
  await page.getByRole('button',{name:'Find your room'}).click();await expect(page.locator('#error')).toBeVisible();
  await page.getByLabel('Check-out',{exact:true}).fill(day(33));await page.getByRole('button',{name:'Find your room'}).click();
  await expect(page.locator('.room-card')).toHaveCount(3);await page.getByLabel('Number of rooms').selectOption('2');await shot('rooms');
  await page.locator('[data-room="2"]').click();await expect(page.locator('.summary-total')).toContainText('€720.00');await shot('guest-form');
  await page.getByLabel('Sample guest name').fill('Sample Guest');await page.getByLabel('Example email',{exact:true}).fill('guest@invalid.test');
  await page.locator('#guest-form button').click();await expect(page.locator('#error')).toContainText('example.com');
  await page.getByLabel('Example email',{exact:true}).fill('guest@example.com');await page.locator('#guest-form button').click();
  await expect(page.locator('#confirm')).toBeVisible();await expect(page.locator('.summary-total')).toContainText('€720.00');await shot('review');
  await page.locator('#confirm').click();await expect(page.locator('.reference')).toContainText('DEMO-');await expect(page.locator('.summary-total')).toContainText('€720.00');
  await page.reload();await expect(page.locator('.reference')).toContainText('DEMO-');await shot('confirmation');
  await page.setViewportSize({width:390,height:844});await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot('mobile-confirmation');
  await page.locator('#restart').click();await expect(page.getByRole('heading',{level:1})).toContainText('Come for the city');await shot('mobile-homepage');
  await page.goto(url+'/#review');await expect(page.locator('#error')).toBeVisible();expect(errors).toEqual([]);
});}
