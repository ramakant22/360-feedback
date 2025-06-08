
const { DataTypes, UUIDV4 } = require('sequelize');
const { mapHierarchyToRole } = require('../utils/auth.utils');

module.exports = (sequelize) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    avatarUrl: {
      type: DataTypes.STRING
    },
    hierarchyLevel: {
      type: DataTypes.ENUM('Team Head', 'Group Head', 'Part Lead', 'Project Lead', 'Engineer'),
      allowNull: false
    },
    reportsTo: { // User ID of the manager
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users', // table name
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('super-admin', 'admin', 'provider'),
      allowNull: false
    }
  }, {
    hooks: {
      beforeValidate: (user, options) => {
        if (user.hierarchyLevel) {
          user.role = mapHierarchyToRole(user.hierarchyLevel);
        }
        if (user.hierarchyLevel === 'Team Head') {
            user.reportsTo = null; // Ensure Team Head reportsTo is null
        }
      }
    }
  });

  return User;
};