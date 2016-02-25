import api from 'axios';

//TODO: api to be added instead of EmailList
var EmailList = [{name: 'C',year: 1972},{name: 'C#',year: 2000},{name: 'C++',year: 1983}];
export const EmailListApi = {
  find() {
    return EmailList;
  }
};
