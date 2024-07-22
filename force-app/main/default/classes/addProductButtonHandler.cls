public with sharing class AddProductButtonHandler {
  public class ParaWrapper {
    @AuraEnabled
    public String limitSize;
    @AuraEnabled
    public String offset;
    @AuraEnabled
    public String fields;
    @AuraEnabled
    public String oppoId;
    @AuraEnabled
    public List<String> checkedRecordIds;
  }
  public class CustomFieldMember {
    @AuraEnabled
    public String objectName;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String type;
    @AuraEnabled
    public String label;
  }

  public class InitData {
    @AuraEnabled
    public List<customFieldMember> fieldMembers;
    @AuraEnabled
    public Integer totalNumberOfRows;
    @AuraEnabled
    public List<PricebookEntry> pricebookEntries;
  }

  public class ParaWrapperWithFilter {
    @AuraEnabled
    public ParaWrapper paraWrapper;
    @AuraEnabled
    public string filter;
  }

  public class DataWithTotalLength {
    @AuraEnabled
    public Integer totalNumberOfRows;
    @AuraEnabled
    public List<PricebookEntry> pricebookEntries;
  }

  @AuraEnabled(cacheable=true)
  public static InitData getInitData(String paraWrapperStr) {
    InitData result = new InitData();
    ParaWrapper p = (ParaWrapper) JSON.deserialize(
      paraWrapperStr,
      ParaWrapper.class
    );
    result.fieldMembers = getFieldMembers(p.fields);
    result.totalNumberOfRows = getTotalNumberOfRows(p.oppoId);
    result.pricebookEntries = getPricebookEntries(paraWrapperStr);
    return result;
  }

  @AuraEnabled(cacheable=true)
  public static dataWithTotalLength getDataWithTotalLength(
    String paraWrapperWithFilterStr
  ) {
    DataWithTotalLength result = new DataWithTotalLength();
    ParaWrapperWithFilter p = (ParaWrapperWithFilter) JSON.deserialize(
      paraWrapperWithFilterStr,
      ParaWrapperWithFilter.class
    );
    result.totalNumberOfRows = getTotalNumberOfRowsWithFilter(
      p.ParaWrapper.oppoId,
      p.filter
    );
    result.pricebookEntries = getPricebookEntriesWithFilter(
      paraWrapperWithFilterStr
    );
    return result;
  }

  @AuraEnabled(cacheable=true)
  public static List<CustomFieldMember> getFieldMembers(String fields) {
    Map<String, List<String>> objToFields = new Map<String, List<String>>();
    for (String s : fields.split(',')) {
      List<String> ObjAndField = s.trim().split('\\.');
      if (objToFields.containsKey(ObjAndField[0])) {
        List<String> fieldList = objToFields.get(ObjAndField[0]);
        fieldList.add(ObjAndField[1]);
        objToFields.put(ObjAndField[0], fieldList);
      } else {
        objToFields.put(ObjAndField[0], new List<String>{ ObjAndField[1] });
      }
    }
    return getFieldMembersByObjToFieldsMap(objToFields);
  }

  public static List<CustomFieldMember> getFieldMembersByObjToFieldsMap(
    Map<String, List<String>> objToFields
  ) {
    List<CustomFieldMember> cFieldSetMembers = new List<CustomFieldMember>();
    for (String obj : objToFields.keySet()) {
      type t = Type.forName(obj);
      SObject instance = (SObject) t.newInstance();
      for (String f : objToFields.get(obj)) {
        Schema.DescribeFieldResult descFieldResult = instance.getSObjectType()
          .getDescribe()
          .fields.getMap()
          .get(f)
          .getDescribe();
        CustomFieldMember cf = new CustomFieldMember();
        cf.objectName = obj;
        cf.name = descFieldResult.getName();
        cf.type = String.valueOf(descFieldResult.getType());
        cf.label = descFieldResult.getLabel();
        cFieldSetMembers.add(cf);
      }
    }
    return cFieldSetMembers;
  }

  @AuraEnabled(cacheable=true)
  public static Integer getTotalNumberOfRows(String oppoId) {
    return [
      SELECT COUNT()
      FROM PricebookEntry
      WHERE
        Pricebook2Id IN (
          SELECT Pricebook2Id
          FROM Opportunity
          WHERE Id = :oppoId
        )
    ];
  }

  @AuraEnabled(cacheable=true)
  public static List<PricebookEntry> getPricebookEntries(
    string paraWrapperStr
  ) {
    ParaWrapper paras = (paraWrParaWrapperapper) JSON.deserialize(
      paraWrapperStr,
      ParaWrapper.class
    );
    String query = '';
    if (!paras.checkedRecordIds.isEmpty()) {
      query =
        'SELECT ' +
        paras.fields +
        ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' +
        paras.oppoId +
        '\') ' +
        ' AND Id NOT IN (\'' +
        string.join(paras.checkedRecordIds, '\' , \'') +
        '\') ' +
        ' ORDER BY Product2.Name LIMIT ' +
        paras.limitSize +
        ' OFFSET ' +
        paras.offset;
    } else {
      query =
        'SELECT ' +
        paras.fields +
        ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' +
        paras.oppoId +
        '\') ORDER BY Product2.Name LIMIT ' +
        paras.limitSize +
        ' OFFSET ' +
        paras.offset;
    }
    List<PricebookEntry> pbEntries = Database.query(query);
    return pbEntries;
  }

  @AuraEnabled(cacheable=true)
  public static PricebookEntry getPricebookEntry(string id, string fields) {
    String query =
      'SELECT ' +
      fields +
      ' FROM PricebookEntry WHERE Id = \'' +
      id +
      '\' LIMIT 1';
    List<PricebookEntry> pbEntries = Database.query(query);
    return pbEntries[0];
  }

  @AuraEnabled(cacheable=true)
  public static List<PricebookEntry> getPricebookEntriesWithFilter(
    string paraWrapperWithFilterStr
  ) {
    ParaWrapperWithFilter parasWithFilter = (ParaWrapperWithFilter) JSON.deserialize(
      paraWrapperWithFilterStr,
      ParaWrapperWithFilter.class
    );
    String query = '';
    if (!parasWithFilter.ParaWrapper.checkedRecordIds.isEmpty()) {
      query =
        'SELECT ' +
        parasWithFilter.ParaWrapper.fields +
        ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' +
        parasWithFilter.paraWrapper.oppoId +
        '\') AND Product2.Name LIKE \'%' +
        parasWithFilter.filter +
        '%\' ' +
        ' AND Id NOT IN (\'' +
        string.join(parasWithFilter.ParaWrapper.checkedRecordIds, '\' , \'') +
        '\') ' +
        ' ORDER BY Product2.Name LIMIT ' +
        parasWithFilter.ParaWrapper.limitSize +
        ' OFFSET ' +
        parasWithFilter.paraWrapper.offset;
    } else {
      query =
        'SELECT ' +
        parasWithFilter.ParaWrapper.fields +
        ' FROM PricebookEntry WHERE Pricebook2Id in (SELECT Pricebook2Id FROM Opportunity WHERE Id = \'' +
        parasWithFilter.paraWrapper.oppoId +
        '\') AND Product2.Name LIKE \'%' +
        parasWithFilter.filter +
        '%\' ORDER BY Product2.Name LIMIT ' +
        parasWithFilter.ParaWrapper.limitSize +
        ' OFFSET ' +
        parasWithFilter.paraWrapper.offset;
    }
    List<PricebookEntry> pbEntries = Database.query(query);
    return pbEntries;
  }

  @AuraEnabled(cacheable=true)
  public static Integer getTotalNumberOfRowsWithFilter(
    String oppoId,
    String product2Name
  ) {
    String filter = '%' + product2Name + '%';
    return [
      SELECT COUNT()
      FROM PricebookEntry
      WHERE
        Pricebook2Id IN (
          SELECT Pricebook2Id
          FROM Opportunity
          WHERE Id = :oppoId
        )
        AND Product2.Name LIKE :filter
    ];
  }

  // SELECT Product2Id, Product2.Name, Quantity, UnitPrice, ServiceDate, Description
  //     FROM OpportunityLineItem
  //     WHERE OpportunityId = '0064x00000MkQmKAAV'
  @AuraEnabled(cacheable=true)
  public static List<String> getRequiredFields(String objApiName) {
    List<String> result = new List<String>();
    type t = Type.forName(objApiName);
    SObject instance = (SObject) t.newInstance();
    for (
      SObjectField field : instance.getSObjectType()
        .getDescribe()
        .fields.getMap()
        .values()
    ) {
      Schema.DescribeFieldResult fieldResult = field.getDescribe();
      if (
        !fieldResult.isNillable() &&
        fieldResult.isCreateable() &&
        !fieldResult.isDefaultedOnCreate()
      ) {
        result.add(String.valueOf(field));
      }
    }
    return result;
  }

  @AuraEnabled
  public static String saveOpportunityLineItems(
    List<OpportunityLineItem> oppoLineItems
  ) {
    Database.SaveResult[] srList = Database.insert(oppoLineItems, false);
    String resultStatus = 'successed';
    // Iterate through each returned result
    for (Database.SaveResult sr : srList) {
      if (!sr.isSuccess()) {
        resultStatus = 'failed';
        for (Database.Error err : sr.getErrors()) {
          System.debug('The following error has occurred.');
          System.debug(err.getStatusCode() + ': ' + err.getMessage());
          System.debug(
            'Account fields that affected this error: ' + err.getFields()
          );
        }
      }
    }

    return resultStatus;
  }
}
