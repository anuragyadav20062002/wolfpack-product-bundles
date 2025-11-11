# Wolfpack Product Bundles - Documentation Index

**Last Updated:** January 2025

---

## 📚 Quick Start

New to the project? Start here:

1. **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Comprehensive development guide
2. **[BUNDLE_WIDGET_INSTALLATION.md](BUNDLE_WIDGET_INSTALLATION.md)** - Widget installation guide
3. **[METAFIELDS_ARCHITECTURE.md](METAFIELDS_ARCHITECTURE.md)** - Understanding metafield structure
4. **[pricing-standardization-complete-plan.md](pricing-standardization-complete-plan.md)** - Pricing system architecture

---

## 🏗️ Core Architecture

### Essential Documentation (Active)

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [METAFIELDS_ARCHITECTURE.md](METAFIELDS_ARCHITECTURE.md) | Complete metafield structure and usage | Oct 2024 |
| [pricing-standardization-complete-plan.md](pricing-standardization-complete-plan.md) | Nested pricing structure (canonical) | Oct 2024 |
| [CART_TRANSFORM_SETUP.md](CART_TRANSFORM_SETUP.md) | Cart transform configuration | Sep 2024 |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Development workflow and best practices | Oct 2024 |

---

## 🔧 Implementation Guides

### Widget & UI

- **[BUNDLE_WIDGET_INSTALLATION.md](BUNDLE_WIDGET_INSTALLATION.md)** - Installing and configuring the widget
- **[2025-01-PRICING-AND-UI-FIXES.md](2025-01-PRICING-AND-UI-FIXES.md)** - Latest pricing display and UI fixes
- **[THEME_EDITOR_DEEPLINKS.md](THEME_EDITOR_DEEPLINKS.md)** - Theme editor integration

### Data & Backend

- **[cart-transform-field-requirements.md](cart-transform-field-requirements.md)** - Required fields for cart transform
- **[CART_TRANSFORM_OPTIMIZATION.md](CART_TRANSFORM_OPTIMIZATION.md)** - Performance optimization
- **[STRICT_PRODUCT_ID_VALIDATION.md](STRICT_PRODUCT_ID_VALIDATION.md)** - Product ID validation rules

### Multi-Currency

- **[complete-multi-currency-implementation.md](complete-multi-currency-implementation.md)** - Complete multi-currency guide (canonical)

---

## 🧪 Testing & Quality

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and checklists
- **[REFACTORING_GUIDE.md](REFACTORING_GUIDE.md)** - Code refactoring guidelines

---

## 📦 Legacy & Historical (Archive)

These documents are kept for historical reference but are superseded by newer implementations:

### Discount/Pricing (Superseded by pricing-standardization-complete-plan.md)
- ~~admin-form-update-summary.md~~ - See pricing-standardization-complete-plan.md
- ~~bundle-widget-fixes-summary.md~~ - See 2025-01-PRICING-AND-UI-FIXES.md
- ~~clean-discount-fix-summary.md~~ - See 2025-01-PRICING-AND-UI-FIXES.md
- ~~comprehensive-discount-fix-summary.md~~ - See 2025-01-PRICING-AND-UI-FIXES.md
- ~~discount-messaging-fix-summary.md~~ - See 2025-01-PRICING-AND-UI-FIXES.md
- ~~discount-variables-documentation.md~~ - See pricing-standardization-complete-plan.md
- ~~streamlined-variables-summary.md~~ - See pricing-standardization-complete-plan.md

### Multi-Currency (Superseded by complete-multi-currency-implementation.md)
- ~~currency-handling-implementation.md~~ - See complete-multi-currency-implementation.md
- ~~multi-currency-implementation-plan.md~~ - See complete-multi-currency-implementation.md
- ~~multi-currency-implementation-summary.md~~ - See complete-multi-currency-implementation.md

### Widget (Superseded by 2025-01-PRICING-AND-UI-FIXES.md)
- ~~bundle-widget-complete-analysis.md~~ - See BUNDLE_WIDGET_INSTALLATION.md
- ~~bundle-widget-restoration-summary.md~~ - Historical reference only

### Metafields (Superseded by METAFIELDS_ARCHITECTURE.md)
- ~~METAFIELD_CHECKLIST.md~~ - See METAFIELDS_ARCHITECTURE.md
- ~~METAFIELD_NAMESPACE_FIX.md~~ - Historical fix, structure now standardized
- ~~METAFIELD_OPTIMIZATION_COMPLETE.md~~ - See METAFIELDS_ARCHITECTURE.md

### Legacy Removal (Completed)
- ~~legacy-removal-implementation.md~~ - Completed Oct 2024
- ~~legacy-removal-plan.md~~ - Completed Oct 2024
- ~~final-implementation-summary.md~~ - Historical reference

### Field Standardization (Completed)
- ~~FIELD_STANDARDIZATION_COMPLETE.md~~ - Completed Oct 2024
- ~~UUID_PREVENTION.md~~ - Completed Oct 2024
- ~~UUID_ROOT_CAUSE_FIX.md~~ - Completed Oct 2024

### One-time Fixes (Historical)
- ~~FIX_SUMMARY_2025-01-04.md~~ - Oct 2024 fixes
- ~~VERIFICATION_REPORT.md~~ - Oct 2024 verification
- ~~FINAL_VERIFICATION.md~~ - Oct 2024 verification
- ~~RECENT_UPDATES.md~~ - See 2025-01-PRICING-AND-UI-FIXES.md

---

## 🗂️ Documentation Organization

### Current Structure

```
docs/
├── README.md (this file)
│
├── Core Architecture/
│   ├── METAFIELDS_ARCHITECTURE.md
│   ├── pricing-standardization-complete-plan.md
│   ├── CART_TRANSFORM_SETUP.md
│   └── DEVELOPER_GUIDE.md
│
├── Implementation Guides/
│   ├── BUNDLE_WIDGET_INSTALLATION.md
│   ├── 2025-01-PRICING-AND-UI-FIXES.md
│   ├── THEME_EDITOR_DEEPLINKS.md
│   ├── cart-transform-field-requirements.md
│   ├── CART_TRANSFORM_OPTIMIZATION.md
│   ├── STRICT_PRODUCT_ID_VALIDATION.md
│   └── complete-multi-currency-implementation.md
│
├── Testing & Quality/
│   ├── TESTING_GUIDE.md
│   └── REFACTORING_GUIDE.md
│
└── Archive/ (legacy docs)
    └── [38 historical documents]
```

---

## 🔍 Finding What You Need

### Common Questions

**Q: How do I set up a new bundle?**
A: See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) → "Creating Bundles" section

**Q: How does pricing work?**
A: See [pricing-standardization-complete-plan.md](pricing-standardization-complete-plan.md)

**Q: Widget not showing discounts correctly?**
A: See [2025-01-PRICING-AND-UI-FIXES.md](2025-01-PRICING-AND-UI-FIXES.md)

**Q: How do I test my changes?**
A: See [TESTING_GUIDE.md](TESTING_GUIDE.md)

**Q: Metafield structure reference?**
A: See [METAFIELDS_ARCHITECTURE.md](METAFIELDS_ARCHITECTURE.md)

**Q: Multi-currency setup?**
A: See [complete-multi-currency-implementation.md](complete-multi-currency-implementation.md)

---

## 🗑️ Cleanup Recommendations

### Safe to Archive (Move to /docs/archive/)

The following files can be moved to an archive folder as they're superseded by current documentation:

1. All discount/pricing fix summaries (10 files)
2. All multi-currency implementation docs except complete version (3 files)
3. All metafield namespace/optimization docs (3 files)
4. All legacy removal docs (3 files)
5. All field standardization/UUID docs (4 files)
6. All one-time fix summaries (4 files)
7. Widget restoration/analysis docs (2 files)

**Total: 29 files can be archived**

### Keep Active (10 files)

1. README.md (this file)
2. DEVELOPER_GUIDE.md
3. METAFIELDS_ARCHITECTURE.md
4. pricing-standardization-complete-plan.md
5. BUNDLE_WIDGET_INSTALLATION.md
6. 2025-01-PRICING-AND-UI-FIXES.md
7. THEME_EDITOR_DEEPLINKS.md
8. CART_TRANSFORM_SETUP.md
9. complete-multi-currency-implementation.md
10. TESTING_GUIDE.md
11. REFACTORING_GUIDE.md
12. CART_TRANSFORM_OPTIMIZATION.md
13. cart-transform-field-requirements.md
14. STRICT_PRODUCT_ID_VALIDATION.md

---

## 📝 Contributing to Documentation

### When to Create New Docs

- **Major feature addition** - Create new comprehensive guide
- **Significant bug fix** - Add to existing guide or create fix summary
- **Architecture change** - Update core architecture docs
- **One-time fix** - Create timestamped fix summary (e.g., 2025-01-FEATURE-FIX.md)

### When to Update Existing Docs

- **Minor bug fixes** - Add to relevant guide
- **Clarifications** - Update existing content
- **Code examples** - Add to implementation guides

### Documentation Standards

1. **Use descriptive titles** - Clear, searchable filenames
2. **Include date/version** - Timestamp significant changes
3. **Link related docs** - Cross-reference for context
4. **Mark obsolete** - Clearly indicate when docs are superseded
5. **Test examples** - Verify all code examples work

---

## 📅 Maintenance Schedule

- **Monthly:** Review and update active docs
- **Quarterly:** Archive superseded documents
- **Yearly:** Major documentation restructure if needed

**Last Review:** January 2025
**Next Review:** February 2025

---

## 🆘 Support

For questions or clarifications:
1. Check this README first
2. Search relevant documentation
3. Check code comments
4. Contact development team
