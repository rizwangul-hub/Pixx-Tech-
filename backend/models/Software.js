const mongoose = require('mongoose');

// URL validator regex supporting http:// and https://
const urlValidator = (val) => {
  if (!val || val.trim() === '') return true; // Optional field
  return /^https?:\/\/.+/i.test(val.trim());
};

const softwareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Software name is required'],
      trim: true,
      maxlength: [100, 'Software name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Software slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be alphanumeric words separated by hyphens'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: urlValidator,
        message: 'Application URL must be a valid HTTP or HTTPS address',
      },
      default: '',
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Phase 5: Single Sign-On (SSO) & Central Integration Configuration
    ssoEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    ssoProtocol: {
      type: String,
      enum: ['OIDC', 'SAML', 'JWT_BEARER', 'CUSTOM', 'DIRECT_LAUNCH'],
      default: 'DIRECT_LAUNCH',
    },
    clientId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    clientSecret: {
      type: String,
      trim: true,
      select: false,
      default: '',
    },
    redirectUris: {
      type: [String],
      default: [],
    },
    postLogoutRedirectUri: {
      type: String,
      trim: true,
      default: '',
    },
    integrationStatus: {
      type: String,
      enum: ['not_configured', 'compatibility_review_required', 'testing', 'verified', 'disabled'],
      default: 'not_configured',
      index: true,
    },
    lastIntegrationCheck: {
      type: Date,
      default: null,
    },
    attributeMapping: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        email: 'email',
        username: 'username',
        role: {},
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Slug auto-generation fallback if omitted (Mongoose 8/9 synchronous hook without next callback)
softwareSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

const Software = mongoose.models.Software || mongoose.model('Software', softwareSchema);

module.exports = Software;
