import { Database } from "bun:sqlite";

// 1. Initialize/Create the SQLite database file
const db = new Database("mydb.sqlite");

console.log("Database and tables created successfully!");
db.close();
