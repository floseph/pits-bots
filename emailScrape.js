const puppeteer = require('puppeteer')
const fs = require('fs')

const navigatedUri = []
const toDoUri = []
const emails = []

async function startScraping(rootUri){

  // launch
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setJavaScriptEnabled(false)



  async function goToPage(uri){
    await page.goto(uri)
  }

  async function scrapeBody(){
    const body = await page.evaluate(() => {
      const tags = document.querySelectorAll('body')
      return Array.from(tags).map( (a) => a.textContent)
    })
    return body
  }

  async function scrapeEmails(){
    const emails = await page.evaluate(() => {
      const emailsTags = document.querySelectorAll('a[href^="mailto:"]')
      return Array.from(emailsTags).map( (a) => a.href)
    })
    const noDuplicateEmails = [... new Set(emails)]
    const noPercentSigns = noDuplicateEmails.filter(email => !email.includes('%'))
    const removedMailto =  noPercentSigns.map(email => email.slice(7))
    return removedMailto
  }

  async function scrapeLinks(){
    const links = await page.evaluate(() => {
      const linkTags = document.querySelectorAll('a')
      return Array.from(linkTags).map( (a) => a.href)
    })

    // remove duplicates
    const noDuplicateLinks = [... new Set(links)]
    const onlySubpageLinks = noDuplicateLinks.filter(link => link.includes(rootUri) )
    const noPdfLinks = onlySubpageLinks.filter(link => !link.includes('pdf'))
    return noPdfLinks
  }



  // initial setup
  await goToPage(rootUri)
  navigatedUri.push(rootUri)
  toDoUri.push(rootUri)


  while(toDoUri != 0){

    const pageToScrape = toDoUri[0]
    toDoUri.shift()
    navigatedUri.push(pageToScrape)
    console.log(`Scraping page >>> ${pageToScrape}`)



    await goToPage(pageToScrape)
    const scrapedLinks = await scrapeLinks()
    const scrapedEmails = await scrapeEmails()

    // add univisted links to toDoUris
    for(let i = 0; i < scrapedLinks.length; i++){
      
      if(!(navigatedUri.includes(scrapedLinks[i]))){
        toDoUri.push(scrapedLinks[i])
        navigatedUri.push(scrapedLinks[i])
      }
    }

    scrapedEmails.forEach(element => {
      if(!emails.includes(element)){
        emails.push(element)
        fs.appendFileSync('emails.txt', element + '\n', 'utf-8')
      }
      
    });

  }

  await browser.close()
}

// startScraping('https://batteriebrueder.herokuapp.com/')
startScraping('http://127.0.0.1:3000/')