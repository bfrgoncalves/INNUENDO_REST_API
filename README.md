# INNUENDO

[![Documentation Status](https://readthedocs.org/projects/innuendo/badge/?version=latest)](https://innuendo.readthedocs.io/en/latest/?badge=latest)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0fffb6e32a564841a1dfb9230616d5f6)](https://app.codacy.com/app/bfrgoncalves/INNUENDO_REST_API?utm_source=github.com&utm_medium=referral&utm_content=bfrgoncalves/INNUENDO_REST_API&utm_campaign=Badge_Grade_Dashboard)

#### A novel cross-sectorial platform for the integration of genomics in surveillance of foodborne pathogens

In this repository you will find all the necessary information regarding 
platform architecture, installation and source code.

> **Architecture**

INNUENDO platform is divided into two distinct applications that communicate 
between each other. The first one, the **INNUENDO frontend server**, comprises 
the user web interface and mechanisms to allow secure user authentication 
using LDAP (if required), and database communication. It also communicates 
with the **INNUENDO process controller**, which was developed with the aim of working as 
a bridge to allow running analytical procedures on a laptop or in a High 
Performance Computer (HPC), with the help of SLURM process manager.

In this repository you can find the source code regarding the **INNUENDO 
frontend server** and its associated RESTful API.
  
> **Installation**

Information about the platform installation can be found at the [documentation](https://innuendo.readthedocs.io/).

> **Source code**

* [**INNUENDO frontend server**](https://github.com/bfrgoncalves/INNUENDO_REST_API) 
* [**INNUENDO process controller server**](https://github.com/bfrgoncalves/INNUENDO_PROCESS_CONTROLLER)

> **Docker-Compose**

A docker-compose version of the INNUENDO Platform is also available and can 
be used for an easier deployment since it installs all the components 
automatically.

* [**Docker-Compose version**](https://github.com/bfrgoncalves/INNUENDO_docker)
