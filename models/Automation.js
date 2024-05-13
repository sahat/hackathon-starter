// Import dependencies
const Sequelize = require('sequelize');
const fs = require('fs');

const sequelize = new Sequelize(process.env.POSTGRESQL_URI);
const wflModel = JSON.parse(fs.readFileSync(path.join(__dirname, './json/automationModel.json')));

// Here we define the user Automation schema for our model
// Automation is related to a user in User table

const Automation = sequelize.define('Automation', {
    userId: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    baseAppId: {    // Base app ID
        type: Sequelize.STRING,
        allowNull: false
    },
    baseAppName: {  // Base app name
        type: Sequelize.STRING,
        allowNull: false
    },
    lastUpdate: {   // Last update date
        type: Sequelize.DATE,
        allowNull: false
    },
    wflId: {        // Workflow ID
        type: Sequelize.STRING,
        allowNull: false
    },
    wflName: {      // Workflow name
        type: Sequelize.STRING,
        allowNull: false
    },
    wflDesc: {      // Workflow description
        type: Sequelize.STRING,
        allowNull: false
    },
    wflStatus: {    // Workflow status
        type: Sequelize.STRING,
        allowNull: false
    },
    wflDefinition: {          // Workflow definition
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: wflModel,
    },
    wflCount: {     // Number of workflows
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {    // Timestamps
    timestamps: true
});

// Create useful functions for the model
Automation.prototype.getBaseAppId = function() {
    return this.getDataValue('baseAppId');
};

Automation.prototype.getBaseAppName = function() {
    return this.getDataValue('baseAppName');
};

Automation.prototype.getLastUpdate = function() {
    return this.getDataValue('lastUpdate');
};

Automation.prototype.getWflId = function() {
    return this.getDataValue('wflId');
};

Automation.prototype.getWflName = function() {
    return this.getDataValue('wflName');
};

Automation.prototype.getWflDesc = function() {
    return this.getDataValue('wflDesc');
};

Automation.prototype.getWflStatus = function() {
    return this.getDataValue('wflStatus');
};

Automation.prototype.getWflDefinition = function() {
    return this.getDataValue('wflDefinition');
};

Automation.prototype.getWflCount = function() {
    return this.getDataValue('wflCount');
};

// Create a new automation
Automation.prototype.createAutomation = function(userId, baseAppId, baseAppName, lastUpdate, wflId, wflName, wflDesc, wflStatus, wflDefinition, wflCount) {
    return Automation.create({
        userId: userId,
        baseAppId: baseAppId,
        baseAppName: baseAppName,
        lastUpdate: lastUpdate,
        wflId: wflId,
        wflName: wflName,
        wflDesc: wflDesc,
        wflStatus: wflStatus,
        wflDefinition: wflDefinition,
        wflCount: wflCount
    });
};

// Get all automations
Automation.prototype.getAllAutomations = function() {
    return Automation.findAll();
};

// Get all automations for a user
Automation.prototype.getAllAutomationsForUser = function(userId) {
    return Automation.findAll({
        where: {
            userId: userId
        }
    });
};

// Get an automation by its ID
Automation.prototype.getAutomationById = function(id) {
    return Automation.findByPk(id);
};

// Get an automation by its base app ID
Automation.prototype.getAutomationByBaseAppId = function(baseAppId) {
    return Automation.findOne({
        where: {
            baseAppId: baseAppId
        }
    });
};

// Update an automation
Automation.prototype.updateAutomation = function(id, baseAppId, baseAppName, lastUpdate, wflId, wflName, wflDesc, wflStatus, wflDefinition, wflCount) {
    return Automation.update({
        baseAppId: baseAppId,
        baseAppName: baseAppName,
        lastUpdate: lastUpdate,
        wflId: wflId,
        wflName: wflName,
        wflDesc: wflDesc,
        wflStatus: wflStatus,
        wflDefinition: wflDefinition,
        wflCount: wflCount
    }, {
        where: {
            id: id
        }
    });
};

// Delete an automation
Automation.prototype.deleteAutomation = function(id) {
    return Automation.destroy({
        where: {
            id: id
        }
    });
};

// Delete all automations for a user
Automation.prototype.deleteAllAutomationsForUser = function(userId) {
    return Automation.destroy({
        where: {
            userId: userId
        }
    });
};


// Sync the model with the database
Automation.sync()
.then(() => {
  console.log('Table Automation synchronisée');
})
.catch((error) => {
  console.error('Erreur lors de la synchronisation de la base de données:', error);
});

// Export the model
module.exports = Automation;
