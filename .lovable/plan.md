

## Move Premium Features and T&C Down

Add `mt-6` (3 steps) to the Premium Features glass-card and the T&C paragraph to push them further down.

### Technical Changes

**`src/pages/Premium.tsx`**:
- Line 192: Add `mt-6` to the Premium Features `div` class — change `"glass-card p-2 px-3"` to `"glass-card p-2 px-3 mt-6"`
- Line 207: Add `mt-6` to the T&C `p` class — change `"text-center text-muted-foreground text-[10px] mt-1 px-4"` to `"text-center text-muted-foreground text-[10px] mt-7 px-4"`

