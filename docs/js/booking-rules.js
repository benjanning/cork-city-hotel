(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.BookingRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const catalog = [
    {
      id: 1,
      name: "The City Single",
      kind: "Single",
      price: 80,
      capacity: 1,
      stock: 8,
      size: 18,
      description: "A thoughtful little retreat for a city break of your own.",
      features: ["Single bed", "Work desk", "Walk-in shower"],
    },
    {
      id: 2,
      name: "The Courtyard Double",
      kind: "Double",
      price: 120,
      capacity: 2,
      stock: 6,
      size: 26,
      description:
        "Room to unwind, with a comfortable double and a quiet outlook.",
      features: ["Double bed", "Reading corner", "Rain shower"],
    },
    {
      id: 3,
      name: "The River King",
      kind: "King",
      price: 160,
      capacity: 2,
      stock: 4,
      size: 34,
      description:
        "A little more space, a king-size bed and time to settle in.",
      features: ["King-size bed", "Lounge area", "Freestanding bath"],
    },
  ];
  const today = () => new Date().toISOString().slice(0, 10);
  function date(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw Error("Choose valid check-in and check-out dates.");
    const n = Date.parse(value);
    if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== value)
      throw Error("Choose dates that exist in the calendar.");
    return n;
  }
  function calculateNights(checkin, checkout) {
    const nights = (date(checkout) - date(checkin)) / 86400000;
    if (!Number.isInteger(nights) || nights < 1 || nights > 365)
      throw Error(
        "Check-out must be after check-in, with a stay of 1–365 nights.",
      );
    return nights;
  }
  function quote(price, quantity, nights) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
      throw Error("Choose between 1 and 10 rooms.");
    if (
      !Number.isInteger(nights) ||
      nights < 1 ||
      nights > 365 ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    )
      throw Error("The price or stay is invalid.");
    return (Math.round(Number(price) * 100) * quantity * nights) / 100;
  }
  function validateStay(stay, currentDate = today()) {
    if (!stay || typeof stay !== "object")
      throw Error("Choose your dates first.");
    const nights = calculateNights(stay.checkin, stay.checkout);
    if (date(stay.checkin) < date(currentDate))
      throw Error("Check-in cannot be in the past.");
    const guests = Number(stay.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 6)
      throw Error("Choose between 1 and 6 guests.");
    return { checkin: stay.checkin, checkout: stay.checkout, guests, nights };
  }
  function makeQuote(rooms, selection, currentDate = today()) {
    const stay = validateStay(selection, currentDate);
    const room = rooms.find((r) => r.id === Number(selection.roomId));
    if (!room) throw Error("Choose an available example room.");
    const quantity = Number(selection.quantity);
    const total = quote(room.price, quantity, stay.nights);
    if (quantity > room.stock)
      throw Error("That quantity exceeds the example availability.");
    if (stay.guests > room.capacity * quantity)
      throw Error("Choose enough rooms for your guests.");
    return {
      ...stay,
      roomId: room.id,
      roomName: room.name,
      quantity,
      unitPriceCents: Math.round(Number(room.price) * 100),
      totalCents: Math.round(total * 100),
    };
  }
  function validateGuest(guest) {
    if (
      !guest ||
      typeof guest.name !== "string" ||
      guest.name.trim().length < 2 ||
      guest.name.trim().length > 60
    )
      throw Error("Enter a sample guest name between 2 and 60 characters.");
    if (
      typeof guest.email !== "string" ||
      guest.email.length > 100 ||
      !/^[-a-z0-9._+]+@example\.com$/i.test(guest.email)
    )
      throw Error("Use an example email ending in @example.com.");
    if (
      !["No preference", "Quiet room", "Late arrival"].includes(guest.request)
    )
      throw Error("Choose an example preference.");
    return {
      name: guest.name.trim(),
      email: guest.email.trim().toLowerCase(),
      request: guest.request,
    };
  }
  return {
    catalog,
    today,
    calculateNights,
    quote,
    validateStay,
    makeQuote,
    validateGuest,
  };
});
