const express = require("express");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const Contact = require("../models/Contact");

const router = express.Router();


/* =====================================================
   EMAIL LOG FILE
===================================================== */

const logsDirectory = path.join(
  __dirname,
  "../logs"
);

const emailLogFile = path.join(
  logsDirectory,
  "email.log"
);


if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, {
    recursive: true
  });
}


if (!fs.existsSync(emailLogFile)) {
  fs.writeFileSync(
    emailLogFile,
    "========================================\n" +
      "SOHAM PAINTING SERVICES\n" +
      "EMAIL LOG\n" +
      "========================================\n\n",
    "utf8"
  );
}


/* =====================================================
   EMAIL LOG FUNCTION
===================================================== */

function writeEmailLog(data) {

  const time =
    new Date().toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata"
      }
    );


  const logEntry = `

========================================
TIME: ${time}
========================================

EMAIL TEMPLATE:
${data.template || ""}

STATUS:
${data.status || ""}

CUSTOMER DETAILS
----------------
Name: ${data.name || ""}
Mobile: ${data.mobile || ""}
Location: ${data.location || ""}
Property Type: ${data.propertyType || ""}
Area: ${data.area || ""}
Service: ${data.service || ""}
Requirements: ${data.requirements || ""}

ENQUIRY ID:
${data.enquiryId || ""}

EMAIL DETAILS
-------------
From: ${data.from || ""}
To: ${data.to || ""}
Subject: ${data.subject || ""}

DURATION:
${data.duration || ""}

MESSAGE ID:
${data.messageId || ""}

SMTP RESPONSE:
${data.smtpResponse || ""}

ERROR CODE:
${data.errorCode || ""}

ERROR MESSAGE:
${data.errorMessage || ""}

========================================

`;


  try {

    fs.appendFileSync(
      emailLogFile,
      logEntry,
      "utf8"
    );

  } catch (error) {

    console.error(
      "Email log write failed:",
      error.message
    );

  }

}


/* =====================================================
   GMAIL TRANSPORTER
===================================================== */

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS

    }

  });


/* =====================================================
   SMTP VERIFY
===================================================== */

transporter.verify(
  (error, success) => {

    if (error) {

      console.error(
        "Gmail SMTP verification failed:"
      );

      console.error(
        error.message
      );

      writeEmailLog({

        template:
          "SMTP Verification",

        status:
          "FAILED",

        errorCode:
          error.code || "",

        errorMessage:
          error.message || ""

      });

    } else {

      console.log(
        "Gmail SMTP is ready"
      );

    }

  }
);


/* =====================================================
   POST /api/contact
===================================================== */

router.post(
  "/contact",
  async (req, res) => {

    const startTime =
      Date.now();


    console.log("------------------------------------------");
    console.log(
      "NEW QUOTATION REQUEST"
    );
    console.log("------------------------------------------");


    try {

      const {
        name,
        mobile,
        location,
        propertyType,
        area,
        service,
        requirements
      } = req.body;


      /* ===============================================
         REQUIRED FIELD VALIDATION
      =============================================== */

      if (
        !name ||
        !mobile ||
        !location ||
        !propertyType ||
        !service
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please fill all required fields."

        });

      }


      /* ===============================================
         MOBILE VALIDATION
      =============================================== */

      const cleanMobile =
        String(mobile).trim();


      if (
        !/^[6-9][0-9]{9}$/.test(
          cleanMobile
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please enter a valid 10-digit mobile number."

        });

      }


      /* ===============================================
         SAVE ENQUIRY
      =============================================== */

      const enquiry =
        await Contact.create({

          name:
            String(name).trim(),

          mobile:
            cleanMobile,

          location:
            String(location).trim(),

          propertyType:
            String(propertyType).trim(),

          area:
            area
              ? String(area).trim()
              : "",

          service:
            String(service).trim(),

          requirements:
            requirements
              ? String(requirements).trim()
              : ""

        });


      const enquiryId =
        enquiry._id.toString();


      console.log(
        "Enquiry saved:",
        enquiryId
      );


      /* ===============================================
         EMAIL SUBJECT
      =============================================== */

      const subject =
        `New Painting Enquiry - ${name}`;


      /* ===============================================
         EMAIL HTML
      =============================================== */

      const emailHTML = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>New Painting Enquiry</title>

</head>


<body
style="
margin:0;
padding:20px;
background:#f4f4f4;
font-family:Arial,Helvetica,sans-serif;
"
>


<div
style="
max-width:650px;
margin:auto;
background:#ffffff;
border-radius:10px;
overflow:hidden;
"
>


<div
style="
background:#111827;
padding:25px;
text-align:center;
color:#ffffff;
"
>

<h1
style="
margin:0;
font-size:25px;
"
>
Soham Painting Services
</h1>

<p
style="
margin:8px 0 0;
color:#d1d5db;
"
>
New Quotation Enquiry
</p>

</div>


<div
style="
padding:30px;
"
>

<h2>
New Customer Enquiry
</h2>


<table
width="100%"
cellpadding="10"
cellspacing="0"
style="border-collapse:collapse;"
>


<tr>

<td style="font-weight:bold;">
Enquiry ID
</td>

<td>
${enquiryId}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Name
</td>

<td>
${name}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Mobile
</td>

<td>
<a href="tel:${cleanMobile}">
${cleanMobile}
</a>
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Location
</td>

<td>
${location}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Property Type
</td>

<td>
${propertyType}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Area
</td>

<td>
${area || "Not provided"}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Service
</td>

<td>
${service}
</td>

</tr>


<tr>

<td style="font-weight:bold;">
Requirements
</td>

<td>
${requirements || "Not provided"}
</td>

</tr>


</table>


<div
style="
text-align:center;
margin-top:30px;
"
>

<a
href="tel:${cleanMobile}"
style="
display:inline-block;
background:#111827;
color:#ffffff;
padding:12px 25px;
border-radius:6px;
text-decoration:none;
font-weight:bold;
"
>
Call Customer
</a>

</div>


</div>


<div
style="
padding:20px;
background:#f9fafb;
text-align:center;
font-size:12px;
color:#6b7280;
"
>

Submitted from
Soham Painting Services website.

</div>


</div>

</body>

</html>

`;


      /* ===============================================
         EMAIL TRIGGER LOG
      =============================================== */

      writeEmailLog({

        template:
          "Quotation Enquiry",

        status:
          "TRIGGERED",

        name,

        mobile: cleanMobile,

        location,

        propertyType,

        area,

        service,

        requirements,

        enquiryId,

        from:
          process.env.EMAIL_USER,

        to:
          process.env.RECEIVER_EMAIL,

        subject

      });


      /* ===============================================
         SEND EMAIL
      =============================================== */

      try {

        const mailResult =
          await transporter.sendMail({

            from:
              `"Soham Painting Services" <${process.env.EMAIL_USER}>`,

            to:
              process.env.RECEIVER_EMAIL,

            replyTo:
              process.env.EMAIL_USER,

            subject,

            html:
              emailHTML

          });


        const duration =
          Date.now() - startTime;


        /* =============================================
           SUCCESS LOG
        ============================================= */

        writeEmailLog({

          template:
            "Quotation Enquiry",

          status:
            "SUCCESS",

          name,

          mobile: cleanMobile,

          location,

          propertyType,

          area,

          service,

          requirements,

          enquiryId,

          from:
            process.env.EMAIL_USER,

          to:
            process.env.RECEIVER_EMAIL,

          subject,

          duration:
            `${duration} ms`,

          messageId:
            mailResult.messageId,

          smtpResponse:
            mailResult.response

        });


        console.log("------------------------------------------");
        console.log(
          "EMAIL SENT SUCCESSFULLY"
        );
        console.log("------------------------------------------");


        return res.status(200).json({

          success: true,

          message:
            "Quotation submitted successfully.",

          enquiryId

        });


      } catch (emailError) {

        const duration =
          Date.now() - startTime;


        /* =============================================
           FAILED EMAIL LOG
        ============================================= */

        writeEmailLog({

          template:
            "Quotation Enquiry",

          status:
            "FAILED",

          name,

          mobile: cleanMobile,

          location,

          propertyType,

          area,

          service,

          requirements,

          enquiryId,

          from:
            process.env.EMAIL_USER,

          to:
            process.env.RECEIVER_EMAIL,

          subject,

          duration:
            `${duration} ms`,

          errorCode:
            emailError.code || "",

          errorMessage:
            emailError.message || ""

        });


        console.error("------------------------------------------");
        console.error(
          "EMAIL FAILED"
        );
        console.error("------------------------------------------");

        console.error(
          emailError.message
        );

        console.error("------------------------------------------");


        // Enquiry is already saved in MongoDB.

        return res.status(200).json({

          success: true,

          message:
            "Quotation submitted successfully. We will contact you shortly.",

          emailSent: false,

          enquiryId

        });

      }


    } catch (error) {

      console.error("------------------------------------------");
      console.error(
        "CONTACT API ERROR"
      );
      console.error("------------------------------------------");

      console.error(
        error.message
      );

      console.error("------------------------------------------");


      return res.status(500).json({

        success: false,

        message:
          "Unable to submit quotation. Please try again."

      });

    }

  }
);


module.exports = router;