const { Random } = require('random-js'),
  random = new Random(),
  dateFormat = require('dateformat');

module.exports = {
  generateDate() {
    let start = new Date(2006, 10, 1);
    let end = new Date(2019, 10, 31);
    let date = random.date(start, end);
    let newdate = dateFormat(date, 'yyyy/mm/dd');
    return newdate;
  },
  returnDate(unixTimestamp) {
    return new Date(unixTimestamp * 1000);
  }
};
