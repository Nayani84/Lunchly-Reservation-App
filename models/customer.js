/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }


  /** methods for getting/setting notes. */

  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** get fullname for this customer. */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find top customers. */
  static async topCustomers() {
    const results = await db.query(
      `SELECT 
      c.id,
      c.first_name,
      c.last_name,
      COUNT(r.id) AS reservation_count
    FROM 
      customers c
    LEFT JOIN 
      reservations r ON c.id = r.customer_id
    GROUP BY 
      c.id, c.first_name, c.last_name
    ORDER BY 
      reservation_count DESC
    LIMIT 10;
    `)
    return results.rows.map(c => new Customer({ id: c.customer_id, firstName: c.first_name, lastName: c.last_name, phone: c.phone, notes: c.notes }));
  }


  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /** get a customer by name. */

  static async searchCustomer(cusFirstName, cusLastName) {
    const results = await db.query(
      `SELECT id, 
      first_name AS "firstName", 
      last_name AS "lastName", 
      phone, 
      notes 
      FROM customers 
      WHERE first_name ILIKE $1 and last_name ILIKE $2 `, 
      [`%${cusFirstName}%`, `%${cusLastName}%`]
    )
    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No customers found for search: ${cusFirstName}, ${cusLastName}`);
      err.status = 404;
      throw err;
    }
    return new Customer(customer);
  }

  
  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

}

module.exports = Customer;
