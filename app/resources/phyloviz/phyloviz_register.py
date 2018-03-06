import subprocess
import argparse


def main():

    parser = argparse.ArgumentParser(description="This program performs remote remote registration to PHYLOViZ Online application")
    parser.add_argument('-u', nargs='?', type=str, help="username", required=True)
    parser.add_argument('-p', nargs='?', type=str, help="password", required=True)
    parser.add_argument('-e', nargs='?', type=str, help="email", required=True)
    parser.add_argument('-c', nargs='?', type=bool, help="encrypt", required=True)

    args = parser.parse_args()

    currentRoot = 'https://online.phyloviz.net'

    out = register(args, currentRoot)
    print out


def register(args, currentRoot):
    print 'Registering...'

    bashCommandUpload = 'curl --data username='+ args.u +'&password='+ args.p +'&email='+ args.e +'&encrypt='+ str(args.c) +'" '+currentRoot+'/users/register'

    process = subprocess.Popen(bashCommandUpload.split(), stdout=subprocess.PIPE)
    output = process.communicate()[0]

    if 'Success' in output:
        return True
    else:
        return False


if __name__ == "__main__":
    main()
