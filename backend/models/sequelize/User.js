const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for OAuth users
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'EMPLOYEE', 'MODERATOR'),
    allowNull: false,
    defaultValue: 'EMPLOYEE'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  oauthProvider: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['outlook', 'google', 'github']]
    }
  },
  oauthId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get safe user data (without password)
User.prototype.toSafeObject = function() {
  const user = this.toJSON();
  delete user.password;
  return user;
};

module.exports = User;

