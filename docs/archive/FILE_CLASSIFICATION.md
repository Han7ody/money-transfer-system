# 📋 File Classification & Recommendations

## Overview
This document classifies every file in the project and provides specific recommendations for each.

---

## Root Level Files

### Documentation Files (15 files)

#### ✅ KEEP & MOVE
| File | Current Location | New Location | Reason |
|------|------------------|--------------|--------|
| ADMIN_SETTINGS_DEPLOYMENT.md | Root | docs/deployment/ | Useful deployment guide |
| CURL_TESTS_SETTINGS.md | Root | docs/api/ | API testing examples |
| SETTINGS_QUICK_REFERENCE.md | Root | docs/api/ | Quick reference guide |
| TROUBLESHOOTING_SETTINGS.md | Root | docs/deployment/ | Troubleshooting guide |
| MAINTENANCE_MODE_QUICK_REFERENCE.md | Root | docs/deployment/ | Maintenance mode guide |

#### 📦 ARCHIVE
| File | Current Location | New Location | Reason |
|------|------------------|--------------|--------|
| IMPLEMENTATION_COMPLETE.md | Root | docs/archive/ | Temporary implementation notes |
| IMPLEMENTATION_PATCH_SUMMARY.md | Root | docs/archive/ | Patch notes (Arabic) |
| IMPLEMENTATION_SUMMARY.md | Root | docs/archive/ | Implementation summary |
| FILES_GENERATED.md | Root | docs/archive/ | Development tracking |
| FILES_MODIFIED_LIST.md | Root | docs/archive/ | Development tracking |
| MAINTENANCE_MODE_ALL_FILES.md | Root | docs/archive/ | Complete file listings |
| MAINTENANCE_MODE_FIX_GUIDE.md | Root | docs/archive/ | Fix guide |
| MAINTENANCE_MODE_READY.md | Root | docs/archive/ | Setup guide |
| COMPLETE_MAINTENANCE_FIX.md | Root | docs/archive/ | Technical documentation |

#### ✏️ ENHANCE
| File | Action | Reason |
|------|--------|--------|
| README.md | Rewrite | Currently minimal, needs comprehensive content |

### SQL Scripts (2 files)

#### ✅ MOVE
| File | Current Location | New Location | Reason |
|------|------------------|--------------|--------|
| enable_maintenance.sql | Root | database/scripts/ | Database operation script |
| disable_maintenance.sql | Root | database/scripts/ | Database operation script |

### Test Scripts (2 files)

#### ✅ MOVE
| File | Current Location | New Location | Reason |
|------|------------------|--------------|--------|
| test-maintenance-debug.ps1 | Root | scripts/ | Utility script |
| test-maintenance-debug.sh | Root | scripts/ | Utility script |

### Configuration Files

#### ✅ KEEP
| File | Status | Notes |
|------|--------|-------|
| .gitignore | Keep | Already properly configured |

#### ❌ DELETE
| File | Reason |
|------|--------|
| package-lock.json | Unused (no root package.json with dependencies) |
| nul | Temporary file |

### Analysis Documents (4 files - Temporary)

#### 🔄 TEMPORARY (Delete after review)
| File | Purpose | Action |
|------|---------|--------|
| PROJECT_ANALYSIS_REPORT.md | Complete analysis | Review, then delete or archive |
| RESTRUCTURING_ACTION_PLAN.md | Action plan | Use, then delete or archive |
| EXECUTIVE_SUMMARY.md | Executive summary | Review, then delete or archive |
| STRUCTURE_COMPARISON.md | Structure comparison | Review, then delete or archive |
| FILE_CLASSIFICATION.md | This file | Review, then delete or archive |

---

## Backend Files

### Source Code (src/)

#### ✅ KEEP ALL
All files in `backend/src/` are production code and should be kept:
- controllers/ (5 files)
- middleware/ (3 files)
- models/ (schema + migrations)
- routes/ (2 files)
- services/ (1 file)
- utils/ (3 files)
- lib/ (1 file)
- seed.ts
- server.ts

#### ⚠️ ENHANCE
| File | Enhancement Needed |
|------|-------------------|
| server.ts | Extract configuration to config/ folder |
| controllers/*.ts | Extract business logic to services |
| seed.ts | Use environment variables for sensitive data |

### Configuration Files

#### ✅ KEEP
| File | Status |
|------|--------|
| package.json | Keep |
| tsconfig.json | Keep |

#### ➕ ADD
| File | Purpose |
|------|---------|
| .env.example | Environment template |
| Dockerfile | Docker configuration |
| jest.config.js | Testing configuration |
| .eslintrc.json | Linting configuration |

### Temporary Files

#### ❌ DELETE
| File | Reason |
|------|--------|
| backend/nul | Temporary file |
| backend/npm | Executable (should be in node_modules) |
| backend/npx | Executable (should be in node_modules) |
| backend/ts-node-dev | Executable (should be in node_modules) |
| backend/rasid-backend@1.0.0 | Unknown file |

### Uploads Folder

#### ✅ KEEP (but gitignore)
| Folder | Status | Notes |
|--------|--------|-------|
| backend/uploads/ | Keep | Ensure in .gitignore |

---

## Frontend Files

### Source Code (src/)

#### ✅ KEEP ALL
All files in `frontend/src/` are production code:
- app/ (all routes and pages)
- components/ (all components)
- context/ (1 file)
- hooks/ (1 file)
- lib/ (1 file)
- store/ (1 file)
- types/ (3 files)
- middleware.ts

#### ⚠️ ENHANCE
| File/Folder | Enhancement Needed |
|-------------|-------------------|
| app/(public)/login/page.tsx | Extract form logic to custom hook |
| app/admin/transactions/page.tsx | Split into smaller components |
| lib/api.ts | Add interceptors and error handling |

### Public Assets

#### ✅ KEEP
| File | Status |
|------|--------|
| frontend/public/*.svg | Keep (default Next.js files) |
| frontend/public/placeholder-doc.png | Keep |

#### ➕ ADD
| Folder | Purpose |
|--------|---------|
| public/images/ | Project images |
| public/icons/ | Custom icons |
| public/fonts/ | Custom fonts |
| public/logo.png | Actual logo (currently missing) |

### Configuration Files

#### ✅ KEEP
| File | Status |
|------|--------|
| package.json | Keep |
| tsconfig.json | Keep |
| next.config.ts | Keep |
| tailwind.config.js | Keep |
| postcss.config.js | Keep |
| eslint.config.mjs | Keep |

#### ➕ ADD
| File | Purpose |
|------|---------|
| .env.example | Environment template |
| Dockerfile | Docker configuration |
| vitest.config.ts | Testing configuration |

---

## Email Templates

### ✅ KEEP ALL
| File/Folder | Status |
|-------------|--------|
| email-templates/base-template.html | Keep |
| email-templates/templates.json | Keep |
| email-templates/templates/en/welcome.html | Keep |
| email-templates/templates/ar/transaction-completed.html | Keep |

### ➕ ADD (Missing Templates)
| Template | Language | Purpose |
|----------|----------|---------|
| password-reset.html | en, ar | Password reset emails |
| email-verification.html | en, ar | Email verification |
| transaction-pending.html | en, ar | Transaction status |
| transaction-approved.html | en, ar | Transaction status |
| transaction-rejected.html | en, ar | Transaction status |
| transaction-completed.html | en | Missing English version |
| kyc-approved.html | en, ar | KYC status |
| kyc-rejected.html | en, ar | KYC status |

---

## Summary Statistics

### Files to Keep
- **Backend:** 30+ files (all source code)
- **Frontend:** 50+ files (all source code)
- **Email Templates:** 4 files
- **Configuration:** 10+ files
- **Total:** ~100 files

### Files to Move
- **Documentation:** 5 files → docs/
- **SQL Scripts:** 2 files → database/scripts/
- **Test Scripts:** 2 files → scripts/
- **Total:** 9 files

### Files to Archive
- **Implementation Docs:** 9 files → docs/archive/
- **Total:** 9 files

### Files to Delete
- **Temporary Files:** 2 files (nul)
- **Unused Lock Files:** 1 file (package-lock.json)
- **Executables:** 4 files (npm, npx, etc.)
- **Analysis Docs:** 5 files (after review)
- **Total:** 12 files

### Files to Create
- **Environment Templates:** 2 files
- **Docker Files:** 3 files
- **CI/CD Files:** 3 files
- **Test Config:** 2 files
- **Documentation:** 10+ files
- **Email Templates:** 8+ files
- **Total:** 28+ files

---

## Action Plan by Priority

### Priority 1: Immediate (Today)
```bash
# Move documentation
mkdir -p docs/{api,deployment,archive}
mv ADMIN_SETTINGS_DEPLOYMENT.md docs/deployment/
mv CURL_TESTS_SETTINGS.md docs/api/
mv SETTINGS_QUICK_REFERENCE.md docs/api/
mv TROUBLESHOOTING_SETTINGS.md docs/deployment/
mv MAINTENANCE_MODE_QUICK_REFERENCE.md docs/deployment/
mv IMPLEMENTATION_*.md docs/archive/
mv FILES_*.md docs/archive/
mv MAINTENANCE_MODE_*.md docs/archive/
mv COMPLETE_MAINTENANCE_FIX.md docs/archive/

# Move scripts
mkdir -p database/scripts scripts
mv enable_maintenance.sql database/scripts/
mv disable_maintenance.sql database/scripts/
mv test-maintenance-debug.* scripts/

# Delete temporary files
rm -f nul backend/nul package-lock.json
rm -f backend/npm backend/npx backend/ts-node-dev backend/rasid-backend@1.0.0
```

### Priority 2: This Week
```bash
# Create environment templates
cat > backend/.env.example << 'EOF'
[environment variables]
EOF

cat > frontend/.env.example << 'EOF'
[environment variables]
EOF

# Update README
# (Rewrite with comprehensive content)
```

### Priority 3: Next Week
```bash
# Create Docker files
touch backend/Dockerfile
touch frontend/Dockerfile
touch docker-compose.yml

# Create CI/CD files
mkdir -p .github/workflows
touch .github/workflows/backend-ci.yml
touch .github/workflows/frontend-ci.yml

# Create test configuration
touch backend/jest.config.js
touch frontend/vitest.config.ts
```

### Priority 4: Following Weeks
- Create missing email templates
- Create API documentation
- Create development guides
- Add testing infrastructure

---

## Verification Checklist

After reorganization, verify:

- [ ] All documentation is in docs/ folder
- [ ] All scripts are in appropriate folders
- [ ] No temporary files remain
- [ ] Backend still runs: `cd backend && npm run dev`
- [ ] Frontend still runs: `cd frontend && npm run dev`
- [ ] Application works as expected
- [ ] Git history is preserved
- [ ] All team members are informed

---

## Notes

1. **Git History:** All moves should use `git mv` to preserve history
2. **Backup:** Create a backup before major reorganization
3. **Team Communication:** Inform team before restructuring
4. **Testing:** Test thoroughly after each phase
5. **Documentation:** Update all internal links after moving files

---

**Last Updated:** December 3, 2025  
**Status:** Ready for implementation
