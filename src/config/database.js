const { Sequelize } = require('sequelize');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    this.sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        }
      }
    );

    DatabaseConnection.instance = this;
  }

  getConnection() {
    return this.sequelize;
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  }

  async syncModels(options = {}) {
    try {
      await this.sequelize.sync(options);
      console.log('Database models synchronized successfully.');
    } catch (error) {
      console.error('Error synchronizing database models:', error);
      throw error;
    }
  }
}

const dbInstance = new DatabaseConnection();
module.exports = dbInstance;

