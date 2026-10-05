#!/usr/bin/env bash
# Four visual directions for the same room, one per port, so they can be
# opened side by side. Same geometry, objects, hang and camera in all four —
# only surface, light and ground differ. See lib/room/variants.ts.
cd "$(dirname "$0")"
pkill -f "next dev -p 384" 2>/dev/null
sleep 1
i=0
for v in daylight grisaille diya ochre; do
  port=$((3841 + i))
  DIST_DIR=".next-$v" NEXT_PUBLIC_VARIANT="$v" \
    npx next dev -p $port > "/tmp/dolly-$v.log" 2>&1 &
  printf '  %-10s http://localhost:%s\n' "$v" "$port"
  i=$((i + 1))
done
wait
