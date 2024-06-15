# Victoria Road Crash Analysis

Collaborators:
- AMIN, Muzaffar
- BUI, Vi
- DINNA, Witness
- NGUYEN, Son
- RADFORD, James

## Project Overview

### Objective
Our project endeavors to cast a spotlight on the underlying patterns of road traffic incidents in the state of Victoria, Australia, by deploying advanced data visualizations. Visualisations will be based on accident dataset attributes including Accident Types, Level of injuries/deaths, demographics of people, types of roads user, weather conditions, location and vehicle types. 

### Visualization Strategy
Leveraging JavaScript libraries such as **Plotly, Leaflet, and D3**, we are crafting an array of interactive charts that serve as a compelling visual narrative of the data. Users will be empowered to:

- **Select Data**: Choose specific datasets for a tailored analytical view.
- **Customize Visuals**: Opt for their preferred chart types, including bar graphs, pie charts, time series analyses, and geospatial representations of accident data.
  
### User Engagement
The interactive platform will invite users to engage with the data intimately, offering them control over the visualization parameters. This hands-on approach aims to foster a deeper understanding of the road safety environment in Victoria.

### Enhanced Data Management
With the integration of the SQLite library available at `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.js`, we've bolstered our data handling capabilities. This allows for efficient querying and manipulation of large datasets directly within the browser, ensuring a robust and responsive database framework.

## Research Questions
Some research questions the visualisations would answer include:
- What are the different types of accidents on Victorian roads?
- What demographic of people are most involved in accidents?
  - Males vs. females
  - Age groups
  - Drivers,  Passengers, Pedestrians, Cyclists 
- What Local Government Areas (LGAs) have the most accidents? Which LGAs have the least?
- How has the number of accidents changed over the years (2012 - 2023)?
- What types of vehicles are mostly involved in accidents?
- What are the most risky conditions to drive in? 

## Data Source

The data underpinning our project was sourced from Vic Roads, under the Department of Transport and Planning, Victoria. The dataset is publicly available through the DataVic website and can be accessed here: https://discover.data.vic.gov.au/dataset/victoria-road-crash-data. 

## Instructions on Using and Interacting with the Project

### Step 1: Repository Download
Clone or download the entire project repository to your local machine.

### Step 2: Database Creation and Loading
1. Launch Visual Studio Code.
2. Open the project folder via the file menu.
3. In the 'explorer' pane, navigate to the 'Data' folder.
4. Run the "Script for database creation and loading" Python file. This action helps create a new SQlite database with the nine csv files contained in the ‘Data’ folder. It will take a few seconds for the process to be completed. 
5. Upon successful execution, the 'RoadCrashesVic.sqlite' file will be generated in the 'Data' folder. The SQlite database can be viewed in an application such as DB Browser for SQlite. 

### Step 3: Node.js Setup (Skip if already installed)
1. Download Node.js from the official website.
2. Install Node.js and verify the installation using `node -v` and `npm -v` commands in the terminal.
3. Install the Express module with `npm install express` to set up the server environment.
    **Note:** It is essential to use Node.js for connecting JavaScript code with a SQLite database, as it transforms your local machine into a server. This approach circumvents Cross-Origin Resource Sharing (CORS) errors that typically                 arise when HTML scripts attempt to interact with databases directly in the browser, due to built-in security measures

### Step 4: Local Server Connection
1. Open the terminal and navigate to the "Victoria Road Crash Analysis" project folder.
2. Type `node server.js` and press enter. It would give you a server link such as this: `http://localhost:3000`.  
3. Click open the link or copy and paste the link in your web browser and press enter. A visualisation web page should launch. Alternatively, the same step can be followed in VS Code by opening the project folder then opening a new terminal and typing `node server.js` and pressing enter. It would give a server link which you can use to launch the visualisation web page.  

### Step 5: Interacting with the Webpage

Our webpage is organized into five distinct sections, each offering unique visualization capabilities:

#### 1.Basic Visualizations
This section enables users to plot basic visualizations of various datasets across different years. To begin:
1. Use the 'Select Field' dropdown menu to choose the desired year for data plotting (available years range from 2012 to 2023).
2. The subsequent dropdown menu allows selection of the dataset type, including:
   - Injuries and Deaths
   - Accident Type
   - Time of Accident
   - Atmospheric Condition
   - Local Government Area
   - Gender
   - Age Group
   - Road User
   - Road Surface Condition
   - Vehicle Body Style
3. Choose the preferred visualization format (bar or pie chart).
4. Click the "Plot Data" button to generate and display the chart.

#### 2.Time Series Plots
Plot time series data spanning from 2012 to 2023 by:
1. Selecting the dataset from the first dropdown menu, options include:
   - Injuries and Deaths
   - Gender
   - Local Government Area
2. Choosing the visualization style (Line Chart or Stacked Bar Chart).
3. Clicking 'Plot Data' to view the time series chart.

#### 3.Sunburst Chart
The chart itself is an interactive chart which can be clicked upon to visualise hierarchical data. It shows count of accidents for 5 different years, with a breakdown on gender, and injury level description. 
To interact with the chart:
1. Click on a year to unfold data for that period, segmented by the count of accidents per gender.
2. Select a gender to drill down into the count of injury levels for that category.
3. Click on the center of the chart to navigate back up the hierarchy, allowing you to select another gender or return to the year selection.

#### 4.(explanation of fourth section)

#### 5.(explanation of fifth section)

## Ethical Considerations

Our project utilizes datasets from the DataVic website, Victoria’s open data platform, that is governed by the DataVic Access Policy. This policy facilitates public access to government data, fostering research, education, and innovation, while contributing to productivity and economic growth in Victoria. It mandates that all state agencies’ datasets be publicly available unless restricted due to privacy, safety, security, law enforcement, public health, or legal compliance.

In line with this policy, our project’s use of DataVic’s data is endorsed and encouraged. Additionally, the Freedom of Information Act 1982 (Vic) mandates public sector transparency, granting access to agency-held information. Our project’s database, built on SQLite, excludes personal identifiers like names or addresses, ensuring individual privacy is maintained in our published work. This approach aligns with both the DataVic policy and privacy regulations, demonstrating our commitment to ethical data usage.

## Files and Folders
Below is the structure of the project repository, detailing the primary files and folders along with their contents:
### Root Directory
- `Index.html`: The main entry point of the web application.
- `app1.js`: JavaScript file containing logic for basic visualizations.
- `app2.js`: JavaScript file for time series plot functionality.
- `app3.js`: JavaScript file handling the Sunburst Chart interactions.
- `styles.css`: Cascading Style Sheets file defining the styling of the webpage.
### Data Folder
Contains all the datasets and scripts used in the project:
- `ACCIDENT.csv`: Dataset containing details about the accidents.
- `ACCIDENT_EVENT.csv`: Information on events related to the accidents.
- `ACCIDENT_LOCATION.csv`: Data on the locations where accidents occurred.
- `ATMOSPHERIC_COND.csv`: Atmospheric conditions during the accidents.
- `NODE.csv`: Node information for mapping purposes.
- `PERSON.csv`: Demographic data of individuals involved in accidents.
- `ROAD_SURFACE_COND.csv`: Conditions of the road surfaces.
- `SUB_DCA.csv`: Subcategory details of the accidents.
- `VEHICLE.csv`: Information about the vehicles involved in accidents.
- `Script for database creation and loading.py`: Python script to create and populate the SQLite database.
- `Metadata Documentation for Victoria Road Crash Database.pdf`: PDF document detailing the metadata of the datasets.
### Project Proposal Folder
- `Project Proposal.docx`: Provides an outline of the proposed project idea, summarizing the core concept and anticipated direction.
  
## Resources & References


