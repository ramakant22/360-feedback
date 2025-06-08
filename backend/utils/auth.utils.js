
// Corresponds to UserHierarchyLevel and UserRole in frontend types.ts

const mapHierarchyToRole = (hierarchyLevel) => {
  switch (hierarchyLevel) {
    case 'Team Head':
      return 'super-admin';
    case 'Group Head':
    case 'Part Lead':
      return 'admin';
    case 'Project Lead':
    case 'Engineer':
      return 'provider';
    default:
      console.warn(`Unknown hierarchy level: ${hierarchyLevel}, defaulting to provider.`);
      return 'provider';
  }
};

module.exports = {
  mapHierarchyToRole
};