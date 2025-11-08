/**
 * Migration utility to handle backward compatibility during the transition
 * from branch string to franchiseLocation ObjectId
 */

const FranchiseLocation = require('../models/FranchiseLocation');

// Helper function to get or create franchise location from branch name
async function getOrCreateFranchiseLocationFromBranch(branchName, createdBy) {
  if (!branchName) return null;
  
  try {
    // First try to find existing location by name
    let location = await FranchiseLocation.findOne({ 
      name: branchName,
      isActive: true 
    });
    
    if (!location) {
      // Create a new franchise location from branch name
      const locationCode = branchName.toUpperCase().replace(/\s+/g, '').substring(0, 10);
      const type = branchName.toLowerCase().includes('oficina') ? 'Oficina' : 'Sucursal';
      
      location = new FranchiseLocation({
        name: branchName,
        code: locationCode,
        type: type,
        address: {},
        contact: {},
        isActive: true,
        createdBy: createdBy,
        notes: 'Auto-created from branch migration'
      });
      
      await location.save();
    }
    
    return location._id;
  } catch (error) {
    return null;
  }
}

// Middleware to handle branch to franchiseLocation conversion
const handleBranchToFranchiseLocationConversion = async (req, res, next) => {
  try {
    // Handle inventory and sales data
    if (req.body.branch && !req.body.franchiseLocation) {
      const locationId = await getOrCreateFranchiseLocationFromBranch(
        req.body.branch,
        req.user?._id || '000000000000000000000000'
      );
      
      if (locationId) {
        req.body.franchiseLocation = locationId;
        // Keep branch for backward compatibility if needed
        delete req.body.branch;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  getOrCreateFranchiseLocationFromBranch,
  handleBranchToFranchiseLocationConversion
};