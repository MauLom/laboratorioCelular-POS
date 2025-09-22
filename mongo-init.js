// MongoDB initialization script for Docker
// This script creates the database and sets up initial configuration

db = db.getSiblingDB('laboratorioCelular');

// Create a collection (this will create the database if it doesn't exist)
db.createCollection('settings');

// Insert a document to ensure the database is created
db.settings.insertOne({
  _id: 'init',
  initialized: true,
  createdAt: new Date(),
  version: '1.0.0'
});

print('Database laboratorioCelular initialized successfully');