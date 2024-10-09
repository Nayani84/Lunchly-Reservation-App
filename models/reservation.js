/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** methods for getting/setting numGuests. */

  set numGuests(val) {
    if (val < 1) throw new Error("Cannot have fewer than 1 guest.");
    this._numGuests = val;
  }

  get numGuests() {
    return this._numGuests;
  }


  /** methods for getting/setting startAt. */

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) {
      this._startAt = val;
    }
    else {
      throw new Error("Not a valid startAt.");
    }
  }

  get startAt() {
    return this._startAt;
  }


  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }


  /** methods for getting/setting notes. */

  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes;
  }


  /** methods for getting/setting customerId */

  set customerId(val) {
    if (this._customerId && this._customerId !== val) {
      throw new Error("Cannot change customer ID");
    }
    this._customerId = val;
  }

  get customerId() {
    return this._customerId;
  }


  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  
  /** save reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET start_at=$1, num_guests=$2, notes=$3
             WHERE id=$4`,
        [this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
