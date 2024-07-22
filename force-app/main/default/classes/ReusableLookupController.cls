public with sharing class ReusableLookupController {
  @AuraEnabled(cacheable=true)
  public static List<SObject> fetchRecords(SearchWrapper inputWrapper) {
    try {
      if (inputWrapper != null) {
        System.debug(inputWrapper);
        String fieldsToQuery = 'SELECT Id, ';
        if (string.isNotBlank(inputWrapper.fieldApiNames)) {
          fieldsToQuery = fieldsToQuery + inputWrapper.fieldApiNames;
        }
        String query = fieldsToQuery + ' FROM ' + inputWrapper.objectApiName;

        query +=
          ' WHERE ' +
          inputWrapper.mainFilter +
          '\'' +
          String.escapeSingleQuotes(inputWrapper.oppoId) +
          '\')';

        if (!inputWrapper.checkedRecordIds.isEmpty()) {
          query +=
            ' AND Id NOT IN (\'' +
            string.join(inputWrapper.checkedRecordIds, '\' , \'') +
            '\') ';
        }

        if (!inputWrapper.noFilter) {
          query +=
            ' AND ' +
            inputWrapper.filterFieldApiName +
            ' LIKE ' +
            '\'%' +
            String.escapeSingleQuotes(inputWrapper.searchString.trim()) +
            '%\'';
        }

        query += ' ORDER BY ' + inputWrapper.sortByFiled;
        query += ' LIMIT ' + inputWrapper.topNum;
        System.debug('query: ' + query);
        List<SObject> sObjList = Database.query(query);
        return sObjList;
      }
      return null;
    } catch (Exception err) {
      System.debug(err.getStackTraceString());
      throw new AuraHandledException(err.getMessage());
    }
  }

  public class SearchWrapper {
    @AuraEnabled
    public String objectApiName { get; set; }
    @AuraEnabled
    public String fieldApiNames { get; set; }
    @AuraEnabled
    public String filterFieldApiName { get; set; }
    @AuraEnabled
    public String mainFilter { get; set; }
    @AuraEnabled
    public String sortByFiled { get; set; }
    @AuraEnabled
    public String oppoId { get; set; }
    @AuraEnabled
    public String searchString { get; set; }
    @AuraEnabled
    public Boolean noFilter { get; set; }
    @AuraEnabled
    public String topNum { get; set; }
    @AuraEnabled
    public List<String> checkedRecordIds { get; set; }
  }
}
