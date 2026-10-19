const {test}=require('node:test');const assert=require('node:assert/strict');const {calculateNights,quote}=require('./booking');
test('night count crosses month and leap day',()=>{assert.equal(calculateNights('2024-02-28','2024-03-01'),2);});
test('reject same day, reversed and impossible dates',()=>{for(const dates of [['2026-01-02','2026-01-01'],['2026-01-01','2026-01-01'],['2026-02-30','2026-03-05']])assert.throws(()=>calculateNights(...dates));});
test('quote uses room, quantity and nights',()=>assert.equal(quote(120,2,3),720));
test('reject non-positive and fractional quantities',()=>{for(const q of [0,-1,1.5,11])assert.throws(()=>quote(80,q,2));});
