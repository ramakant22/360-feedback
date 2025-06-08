
const db = require("../models");
const User = db.User;
const { mapHierarchyToRole } = require('../utils/auth.utils');

// Create and Save a new User
exports.create = async (req, res) => {
  try {
    const { name, email, avatarUrl, hierarchyLevel, reportsTo } = req.body;
    if (!name || !email || !hierarchyLevel) {
      return res.status(400).send({ message: "Name, email, and hierarchy level are required." });
    }

    // Check if reportsTo is valid if provided, and not self
    if (reportsTo) {
        const managerExists = await User.findByPk(reportsTo);
        if (!managerExists) {
            return res.status(400).send({ message: `Manager with id ${reportsTo} does not exist.`});
        }
    }
    
    const user = {
      name,
      email,
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${email}/100/100`,
      hierarchyLevel,
      reportsTo: hierarchyLevel === 'Team Head' ? null : reportsTo, // Ensure reportsTo is null for Team Head
      role: mapHierarchyToRole(hierarchyLevel) // Role is derived by hook, but good to have it here too
    };

    const createdUser = await User.create(user);
    res.status(201).send(createdUser);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while creating the User."
    });
  }
};

// Retrieve all Users from the database.
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['name', 'ASC']]
    });
    res.send(users);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving users."
    });
  }
};

// Find a single User with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findByPk(id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({
        message: `Cannot find User with id=${id}.`
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error retrieving User with id=" + id });
  }
};

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const { name, email, avatarUrl, hierarchyLevel, reportsTo } = req.body;
    
    if (reportsTo === id) {
        return res.status(400).send({ message: "A user cannot report to themselves." });
    }
    if (reportsTo) {
        const managerExists = await User.findByPk(reportsTo);
        if (!managerExists) {
            return res.status(400).send({ message: `Manager with id ${reportsTo} does not exist.`});
        }
    }
    
    const updateData = { ...req.body };
    if (hierarchyLevel) {
        updateData.role = mapHierarchyToRole(hierarchyLevel);
         if (hierarchyLevel === 'Team Head') {
            updateData.reportsTo = null; // Ensure reportsTo is null if becoming Team Head
        }
    }


    const [num] = await User.update(updateData, { where: { id: id } });
    if (num === 1) { // Sequelize update returns an array with one element: the number of affected rows
      const updatedUser = await User.findByPk(id); // Fetch the updated user
      res.send(updatedUser);
    } else {
      res.status(404).send({
        message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error updating User with id=" + id + ": " + error.message });
  }
};

// Delete a User with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    // Check for dependencies: if user is a manager for anyone
    const directReports = await User.count({ where: { reportsTo: id } });
    if (directReports > 0) {
      return res.status(400).send({ message: `Cannot delete user ${id}. They manage ${directReports} other user(s). Please reassign reports first.` });
    }

    // Additional checks for involvement in feedback requests can be added here if strict deletion rules are needed.
    // For now, foreign key constraints (ON DELETE SET NULL or CASCADE) in the DB schema will handle this.
    // E.g., if feedback_requests.subjectUserId has ON DELETE CASCADE, deleting user will delete their requests.

    const num = await User.destroy({ where: { id: id } });
    if (num === 1) {
      res.send({ message: "User was deleted successfully!" });
    } else {
      res.status(404).send({
        message: `Cannot delete User with id=${id}. Maybe User was not found!`
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Could not delete User with id=" + id + ": " + error.message });
  }
};