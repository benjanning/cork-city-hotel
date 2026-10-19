function calculateNights(checkin, checkout) {
  const valid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  if (!valid(checkin) || !valid(checkout)) throw new Error('Enter valid dates');
  const nights = (Date.parse(checkout) - Date.parse(checkin))/86400000;
  if (!Number.isInteger(nights) || nights < 1 || nights > 365) throw new Error('Stay must be between 1 and 365 nights');
  return nights;
}
function quote(price, quantity, nights) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error('Choose 1 to 10 rooms');
  return price * quantity * nights;
}
module.exports = {calculateNights, quote};
