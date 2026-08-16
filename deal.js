const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  value: { type: Number, required: true, default: 0 },
  stage: { 
    type: String, 
    enum: ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], 
    default: 'Lead' 
  },
  owner: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Deal', DealSchema);