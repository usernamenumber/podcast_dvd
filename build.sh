#!/bin/bash
T=$(date +%Y%m%d%H%H%M%S)
SOURCE_DIRS="Bonus CastCrew Commentaries Episodes Notes Scripts src"

function content() {
    for d in $SOURCE_DIRS; do mkdir -p $d; done
    [ -e Site/Files ] || mkdir -p Site/Files
    ./parse.py &&
    rsync -aP --exclude '.git*' --exclude '*.reapeaks' --exclude '*~' $SOURCE_DIRS Site/Files/ && 
    rsync -aP iso_files/ Site/ &&
    find Site/ -iname '*~' -exec rm -f {} \; &&
    find Site/ -iname '.DS_Store' -exec rm -f {} \; 
    find Site/ -iname '.git*' -exec rm -f {} \; 
}

function iso() {
    # Unmount previously-mounted images (OSX-specific)
    M=$(df | grep 'fpbf' | awk '{print $1}')
    if [ -n "$M" ] 
    then
        for m in $M; do sudo hdiutil detach $m ; done
    fi
    SetFile -a E 'Site/Double-Click to Begin!.html' &&
    echo $T > Site/Files/version.txt
    rm -f SecondShiftComplete.iso
    # TODO: Add mkisofs support for other platforms
    hdiutil makehybrid Site/ -o SecondShiftComplete.iso
}

case $1 in
    "content")
        content
    ;;
    "iso")
        iso
    ;;
    *)
        content
        iso
    ;;
esac
