# CUJ: Review App Cleanup Recommendations

## User Goal

As a desktop user, I want to see which apps I rarely use and why RevPref thinks they deserve review, so I can safely clean up startup load or uninstall apps I no longer need.

## Journey

1. User imports or collects local app inventory and usage data.
2. RevPref ranks recommendations by cleanup confidence.
3. User opens a recommendation detail view.
4. RevPref shows evidence: last used, foreground usage, startup entries, disk size, background runtime.
5. User chooses one of: keep, ignore, review later, disable startup externally, open official uninstall handoff.
6. RevPref stores the decision locally and updates future recommendations.

## Trust Requirements

- The user can see why the recommendation exists.
- The user can mark an app as keep.
- The product never removes an app automatically.
- System apps are not presented as ordinary uninstall candidates.

## Failure States

- Missing usage data should produce lower-confidence recommendations.
- Unknown disk size should not block recommendation generation.
- Importer errors should be visible and non-destructive.
