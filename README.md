# INNUENDO
#### A novel cross-sectorial platform for the integration of genomics in surveillance of foodborne pathogens

In this repository you will find all the necessary information regarding platform architecture, installation and source code.

> **Architecture**

INNUENDO platform is divided into two distinct applications that comunicate between each other. The first one, the **INNUENDO frontend server**, comprises the user web interface and mechanisms to allow secure user authentication with LDAP and data storage into a dedicated database. It also comunicates with the **INNUENDO process controller**, which was developed with the aim of working as a bridge to allow running analytical procedures on a laptop or in a High Performance Computer (HPC), with the help of SLURM process manager.

In this repository you can find the source code regarding the **INNUENDO 
frontend server** and its associated RESTful API.
  
> **Installation**

Information about the platform instalation can be found at the [**wiki**](https://github.com/B-UMMI/INNUENDO/wiki)

> **Source code**

* [**INNUENDO frontend server**](https://github.com/B-UMMI/INNUENDO_REST_API) 
* [**INNUENDO process controller server**](https://github.com/B-UMMI/INNUENDO_PROCESS_CONTROLLER)
