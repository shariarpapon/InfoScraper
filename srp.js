const TARGET_URL = "https://www.sculpsure.com/results/?country=US";

const cheerio = require("cheerio");
const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs");
const { url } = require("inspector");
const { title } = require("process");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var USA_Links = [];
var USA_Titles = [];

const csvWriter = createCsvWriter({
  path: 'US_CSV.csv',
  header: [
      
        {id: "Provider", title:'Provider Name'},
        {id: 'Business_Name', title:'Business Name'},
        {id: 'Business_Email', title: 'Business Email'},
        {id: 'Business_Location', title: 'Business Location'},
        {id: 'Business_Link', title:'Business Link'}
  ]
});

async function FetchProviderCompanyData(_url)
{
  console.log(chalk.yellow.bgBlue(`\n  Scraping of ${chalk.underline.bold(_url)} initiated...\n`));

  try {
    const response = await axios.get(_url)
    const $ = cheerio.load(response.data)

    $(".provider-card__logo").each((i, elm)=>
    {
        const link = $(elm).attr('href');
        USA_Links.push(link.toString());
    });

    $(".provider-card__title").each((i, elm)=>
    {
        const title = $(elm).text().toString().trim();
        USA_Titles.push(title);
    });

    console.log("Title Count : " + USA_Titles.length)
    console.log("Link Count : " + USA_Links.length);
  } 
  catch (error) {
    console.error(error)
  }
}

FetchProviderCompanyData(TARGET_URL).then(FetchProviderData).catch(console.error);

var csvProviderData = [];

async function FetchProviderData()
{
    for(i = 0; i < USA_Links.length; i++)
    {
      try
      {
        _url = USA_Links[i];

        const response = await axios.get(_url)
        const $ = cheerio.load(response.data)
        _title = $('.provider-about__title').text().replace(/\s\s+/g, '');
        
        var companyLink = '';
        var companyName = '';
        var companyLocation = ''; 
        var companyEmail = '';

        if(_title.toLowerCase() == USA_Titles[i].toLowerCase())
        {
          companyName = _title;
          $(".provider-contact__details li a").each((i, elm)=>
          {
              if(i == 0)
              {
                companyLink = $(elm).attr('href');
              }
          });

          $(".provider-contact__location address").each((i, elm)=>
          {
              companyLocation = $(elm).html().split('<br')[1].substr(1);
          });

          try{
          await axios.get(companyLink).then(
            (provResponse)=>{
              const C = cheerio.load(provResponse.data);
              hLink = '';
              C('a[href^="mailto:"]').each((i, elm)=>
              { 
                if(i == 0)
                {
                  hLink = C(elm).attr("href")?.replace('mailto:', '');
                }
              });
            }
          ).catch(console.error);
        }catch{console.error}

          $(".provider-bio__detail h2").each((i, elm)=>
          {
              provider = $(elm).text().toString().trim();

              companyLocation = companyLocation.replace(/,/g, "");
              
              var csvData = 
              {
                Provider : provider,
                Business_Name : companyName,
                Business_Email : companyEmail,
                Business_Location : companyLocation,
                Business_Link : companyLink,
              }
              csvProviderData.push(csvData);
              console.log("Inspecting Provider : " + csvProviderData.length)
          });
        }

      }  
      catch (error) { console.error(error) }
    }

    console.log("PROVIDER COUNT : " + csvProviderData.length); 

  //////////////////////////////// WRTIE CSV
  const records = csvProviderData;
  
  csvWriter.writeRecords(records)
      .then(() => {
          console.log('...DONE WRITING ALL DATA TO CSV FILE');
      });
  ////////////////////////////////
}





