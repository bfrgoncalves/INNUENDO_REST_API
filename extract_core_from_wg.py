#!/usr/bin/env python

import csv
import argparse

'''
This program removes genes from a tab delimited file according to a key-value 
list. Currently it only allows replacing chewBBACA tags by 0
'''


def main():
    """

    This program removes genes from a tab delimited file according to a list
    of locus identifiers.
    It also allows only replacing chewBBACA missing data tags by 0.

    Returns
    -------
    file: writes a set of files. One with all header identifiers and other
    with the resulting profiles in a tab delimited format.
    """

    parser = argparse.ArgumentParser(
        description="This program removes gens from a tab separated allele "
                    "profile file")
    parser.add_argument('-i', nargs='?', type=str,
                        help='main matrix file from which to remove',
                        required=True)
    parser.add_argument('-g', nargs='?', type=str,
                        help='list of genes to remove', required=True)
    parser.add_argument('-o', nargs='?', type=str,
                        help='output file name', required=True)
    parser.add_argument("--inverse",
                        help="list to remove is actually the one to keep",
                        dest='inverse', action="store_true", default=False)
    parser.add_argument("--onlyreplace", help="Only replaces letters by 0",
                        dest='onlyreplace', action="store_true", default=False)

    args = parser.parse_args()
    mainListFile = args.i
    toRemoveListFile = args.g
    outputfileName = args.o
    inverse = args.inverse

    # Key-value dictionary with the tags that need to be changed by 0
    allele_classes_to_ignore = {
        'LNF': '0',
        'INF-': '',
        'NIPHEM': '0',
        'NIPH': '0',
        'LOTSC': '0',
        'PLOT3': '0',
        'PLOT5': '0',
        'ALM': '0',
        'ASM': '0'
    }

    if inverse:
        FilesToRemove = ['File', 'FILE', 'file']
    else:
        FilesToRemove = []

    with open(toRemoveListFile) as f:
        for File in f:
            File = File.rstrip('\n')
            File = File.rstrip('\r')
            File = (File.split('\t'))[0]
            FilesToRemove.append(File)

    with open(mainListFile, 'rb') as tsvin, open(outputfileName + ".tsv", "wb")\
            as csvout, open(outputfileName + "_headers.txt", "wb")\
            as headers_out:

        # Opens the file with the locus tags to be included in the final profile
        #  file.
        tsvin = csv.reader(tsvin, delimiter='\t')

        listindextoremove = []

        # Checks if a locus exists in the whole genome profile. If exists it
        # marks it to be removed.
        for firstline in tsvin:
            for gene in firstline:
                if gene in FilesToRemove and not inverse:
                    listindextoremove.append(firstline.index(gene))
                elif gene not in FilesToRemove and inverse:
                    listindextoremove.append(firstline.index(gene))

            if not args.onlyreplace:
                for elem in reversed(listindextoremove):
                    del firstline[elem]
            
            csvout.write(('\t'.join(firstline)) + "\n")
            headers_out.write(('\n'.join(firstline)))
            break

        # Deletes the profile indexes to be removed from each profile.
        for line in tsvin:
            if not args.onlyreplace:
                for elem in reversed(listindextoremove):
                    del line[elem]

            string_list = ('\t'.join(line))

            for k, v in allele_classes_to_ignore.iteritems():
                string_list = string_list.replace(k,v)

            # Writes the processed profile to the final profiles file.
            csvout.write(string_list + "\n")


if __name__ == "__main__":
    main()
