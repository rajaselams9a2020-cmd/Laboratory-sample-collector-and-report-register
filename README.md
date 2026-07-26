# Laboratory Sample Register

**Problem Statement:**
A diagnostic laboratory needs a digital register to track sample collection, processing, and report issuing to avoid manual searching and prevent delays in patient care. This application solves the problem by providing a searchable, filterable digital register that automatically calculates waiting times.

**How to Run the Application:**
1. Ensure Node.js is installed.
2. Clone this repository and run `npm install` to install dependencies (express, sqlite3, cors).
3. Run `node server.js` to start the backend server and initialize the database.
4. Open a web browser and navigate to `http://localhost:3000`.

**Database Fields Explanation:**
* `sample_id`: Unique ID for each sample (Primary Key).
* `patient_name`: Full name of the patient.
* `test_type`: The specific diagnostic test requested.
* `collected_date`: The date the sample was taken.
* `status`: Current state of the sample (Pending, Processed, Reported).
* `processed_date`: Date when the lab completed the test.
* `report_issued_date`: Date when the final report was given.
* `collected_by`: Name of the technician who took the sample.

**Derived Value Calculation (Days Waiting):**
The "Days Waiting" value is calculated dynamically on the server side. When the data is fetched, the server checks if the status is NOT "Reported". If so, it calculates the difference in days between the `collected_date` and the current date. This ensures the laboratory always sees accurate wait times.

**Project Demonstration Video:**
https://drive.google.com/file/d/1MV-sfM3nerLijEdvhqIknIxF2zKQlcRw/view?usp=drivesdk
