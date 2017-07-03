import subprocess
import argparse
import os
import shutil
import os

import mlst_profiles_to_db


def main():

	parser = argparse.ArgumentParser(description="This program build a db and creates the indexes for searches and correspondence files")
	parser.add_argument('-i', nargs='?', type=str, help="Profile File", required=True)
	parser.add_argument('-m', nargs='?', type=str, help="Metadata file", required=True)
	parser.add_argument('-c', nargs='?', type=str, help="Classification file", required=True)
	parser.add_argument('-p', nargs='?', type=str, help="platform tag", required=True)
	parser.add_argument('-d', nargs='?', type=str, help="database", required=True)


	args = parser.parse_args()

	mlst_profiles_to_db.mlst_profiles_to_db(args.i, args.c, args.m, args.d, args.p)
	


if __name__ == '__main__':
	main()