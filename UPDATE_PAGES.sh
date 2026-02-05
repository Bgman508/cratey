#!/bin/bash
# Script to help update remaining page files
# Run this from the project root

echo "Cratey Page Update Helper"
echo "========================="
echo ""
echo "Files that need to be updated:"
echo ""

grep -l "base44" src/pages/*.jsx src/components/products/*.jsx src/components/dashboard/*.jsx 2>/dev/null | while read file; do
    echo "  - $file"
done

echo ""
echo "To update each file, replace:"
echo ""
echo "  import { base44 } from '@/api/base44Client';"
echo ""
echo "With:"
echo ""
echo "  import { productAPI, artistAPI, orderAPI, libraryAPI, stripeAPI, authAPI } from '@/api/apiClient';"
echo ""
echo "And replace base44 calls with the new API client methods."
echo ""
echo "See MIGRATION.md for detailed instructions."
