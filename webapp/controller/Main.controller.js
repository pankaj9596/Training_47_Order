sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
    'sap/m/MessageToast',
    'sap/ui/core/Fragment',
    "sap/m/MessageBox",
    'sap/m/p13n/Engine',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/p13n/FilterController',
	'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library'],
    function (Controller, JSONModel, Filter, FilterOperator, spreadsheetLibrary, Spreadsheet, MessageToast, Fragment,MessageBox, Engine, SelectionController, SortController, GroupController, FilterController, MetadataHelper,ColumnWidthController,coreLibrary) {
        "use strict";
        var EdmType = spreadsheetLibrary.EdmType;
        return Controller.extend("com.training.order.controller.Main", {
            onInit: function () {
                var self = this;
                // sap.ui.getCore().getConfiguration().setLanguage("de");
                var oModel = new JSONModel("/model/data.json", '', false);
                // var oModel = new sap.ui.model.json.JSONModel()
                oModel.dataLoaded().then(function (data) {
                    oModel.setSizeLimit(1000);
                    console.log(oModel.getData());
                    this.getView().setModel(oModel);
                    this._registerForP13n();
                }.bind(this));

              
            },
            onSearch: function (oEvent) {
                debugger;
                // holds the values passed into the search field
                var sQuery = oEvent.getSource().getValue();

                // add filter for search
                var aGlobalFilters = [];

                if (sQuery && sQuery.length > 0) {
                    var aFilters = []
                    var orderIdFilter = new Filter("OrderID", FilterOperator.EQ, sQuery);
                    var countryFilter = new Filter("ShipCountry", FilterOperator.Contains, sQuery);
                    aFilters.push(orderIdFilter);
                    aFilters.push(countryFilter);

                    var oCombinedFilter = new Filter({
                        filters: aFilters,
                        and: false
                    });

                    aGlobalFilters.push(oCombinedFilter);
                }



                //update the bindind of the table

                var oTable = this.getView().byId("tblOrder");
                var oBinding = oTable.getBinding("items");
                oBinding.filter(aGlobalFilters, "Applications");

            },

            onExport: function () {
                // Taking source of the table which is binded with the local json model
                var oOrderTable = this.getView().byId("tblOrder");
                // get the binding
                var oBinding = oOrderTable.getBinding("items");
                var aColumn = [];
                //prepare column configuration
                var oColumnOrderId = {
                    label: 'Order Id',
                    property: 'OrderID',
                    type: EdmType.Number,
                    width: '15',
                }
                var oColumnShipName = {
                    label: 'Ship Name',
                    property: 'ShipName',
                    type: EdmType.String,
                    width: '10',
                    textAlign: 'center',
                    wrap: true
                }
                aColumn.push(oColumnOrderId);
                aColumn.push(oColumnShipName);
                // prepare spreadsheet setting
                var oSettings = {
                    workbook: {
                        columns: aColumn
                    },
                    dataSource: oBinding,
                    fileName: 'Order.xlsx'
                }
                // initializae spreadsheet constructor
                var oSheet = new Spreadsheet(oSettings);
                oSheet.onprogress = function (iValue) {
                    ("Export: %" + iValue + " completed");
                };
                oSheet.build()
                    .then(
                        function () {
                            MessageToast.show("Data downloaded successfully..!!")
                        }
                    )
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            onPressOrderId: function (oEvent) {

                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel()
                var oContextObj = oModel.getProperty(sPath);

                var oView = this.getView();
                if (!this._displayOrderDialog) {
                    this._displayOrderDialog = Fragment.load({
                        id: 'frgDisplayOrder',
                        name: "com.training.order.fragment.DisplayOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }

                // this._displayOrderDialog.bindElement(sPath);

                this._displayOrderDialog.then(function (oDialog) {
                    oDialog.bindElement(sPath)
                    oDialog.open()
                }.bind(this));

            },
            onPressEditOrder: function (oEvent) {

                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel()
                var oContextObj = oModel.getProperty(sPath);

                var oView = this.getView();
                if (!this._editOrderDialog) {
                    this._editOrderDialog = Fragment.load({
                        id: this.createId("frgEditOrder"),
                        name: "com.training.order.fragment.EditOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }

                // this._displayOrderDialog.bindElement(sPath);

                this._editOrderDialog.then(function (oDialog) {
                    oDialog.bindElement(sPath)
                    oDialog.open()
                }.bind(this));

            },
            onPressCreateOrder: function () {
                var oView = this.getView();
                if (!this._createOrderDialog) {
                    this._createOrderDialog = Fragment.load({
                        id: 'frgCreateOrder',
                        name: "com.training.order.fragment.CreateOrder",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog)
                        return oDialog;
                    });
                }
                this._createOrderDialog.then(function (oDialog) {

                    oDialog.open()
                }.bind(this));

            },

            onCreateOrderPress: function () {
                debugger;
                var iOrderId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").getValue();
                var sCustomerId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateCustomerId").getValue();
                var iEmployeeId = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateEmployeeId").getValue();
                var dOrderDate = sap.ui.core.Fragment.byId("frgCreateOrder", "dpCreateOrderDate").getValue();
                var sShipName = sap.ui.core.Fragment.byId("frgCreateOrder", "txtAreaCreateShipName").getValue();
                var sShipCity = sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateShipCity").getValue();
                var sShipCountry = sap.ui.core.Fragment.byId("frgCreateOrder", "cbShipCountry").getSelectedItem().getText();


                if(!iOrderId){
                    sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").setValueState("Error")
                }else{
                    sap.ui.core.Fragment.byId("frgCreateOrder", "inpCreateOrderId").setValueState("None")
                }

                var obj = {
                    
                        "OrderID": iOrderId,
                        "CustomerID": sCustomerId,
                        "EmployeeID": iEmployeeId,
                        "OrderDate": dOrderDate,
                        "ShipName": sShipName,
                        "ShipAddress": "59 rue de l'Abbaye",
                        "ShipCity": sShipCity,
                        "ShipPostalCode": "51100",
                        "ShipCountry": sShipCountry
                }

                var oModel = this.getView().getModel();
                var aData = oModel.getProperty("/Orders")
                aData.push(obj);
                oModel.setProperty("/Orders",aData);
                oModel.refresh(true);

                this.onCloseCreateDialogPress();
            },
            onCloseCreateDialogPress: function(){
                this._createOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },
            onCloseDisplayDialogPress: function(){
                this._displayOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },
            onCloseEditDialogPress: function(){
                this._editOrderDialog.then(function (oDialog) {

                    oDialog.close()
                }.bind(this));
            },

            onPressDeleteOrder: function(oEvent){
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var oModel = oEvent.getSource().getModel();
                var aData = oModel.getProperty("/Orders")
                var oContextObj = oModel.getProperty(sPath);
                var idx = parseInt(sPath.substring(sPath.lastIndexOf('/') +1));
               
                
                var sMessage = "Are you sure, you want to delete the Order : " + oContextObj.OrderID;
                var sTitle = "Confirm Deletion?"
                MessageBox.confirm(sMessage,{
                    title : sTitle,
                    actions : [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction : sap.m.MessageBox.Action.OK,
                    onClose : function(evt){
                        debugger;
                        if(evt === "OK"){
                           
                                aData.splice(idx, 1);
                                oModel.setProperty("/Orders",aData);
                                oModel.refresh(true);
                        }else{
                            return;
                        }
                    }.bind(this)
                });

            },
            onUpdateOrderDialogPress: function(oEvent){
                debugger;
                this._editOrderDialog.then(function (oDialog) {
                    // oDialog.bindElement(sPath)
                    debugger;
                }.bind(this));
            },
            _fnI18n: function(sKey){
                var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var sText = oResourceBundle.getText(sKey)
                if(sText){
                    return sText;
                }else{
                    return sKey;
                }
            },
            _registerForP13n: function() {
                const oTable = this.byId("tblOrder");
    
                this.oMetadataHelper = new MetadataHelper([{
                        key: "orderId_col",
                        label: this._fnI18n("orderId"),
                        path: "OrderID"
                    },
                    {
                        key: "customerId_col",
                        label: this._fnI18n("customerId"),
                        path: "CustomerID"
                    },
                    {
                        key: "employeeId_col",
                        label: this._fnI18n("employeeId"),
                        path: "EmployeeID"
                    },
                    {
                        key: "orderdate_col",
                        label: this._fnI18n("orderdate"),
                        path: "OrderDate"
                    },
                    {
                        key: "shipName_col",
                        label: this._fnI18n("shipName"),
                        path: "ShipName"
                    },
                    {
                        key: "shipCity_col",
                        label: this._fnI18n("shipCity"),
                        path: "ShipCity"
                    },
                    {
                        key: "shipCountry_col",
                        label: this._fnI18n("shipCountry"),
                        path: "ShipCountry"
                    }
                ]);
    
                Engine.getInstance().register(oTable, {
                    helper: this.oMetadataHelper,
                    controller: {
                        Columns: new SelectionController({
                            targetAggregation: "columns",
                            control: oTable
                        }),
                        Sorter: new SortController({
                            control: oTable
                        }),
                        Groups: new GroupController({
                            control: oTable
                        }),
                        ColumnWidth: new ColumnWidthController({
                            control: oTable
                        }),
                        Filter: new FilterController({
                            control: oTable
                        })
                    }
                });
    
                Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
            },
            handleStateChange: function(oEvt) {
                const oTable = this.byId("tblOrder");
                const oState = oEvt.getParameter("state");
    
                if (!oState) {
                    return;
                }
    
                //Update the columns per selection in the state
                this.updateColumns(oState);
    
                //Create Filters & Sorters
                const aFilter = this.createFilters(oState);
                const aGroups = this.createGroups(oState);
                const aSorter = this.createSorters(oState, aGroups);
    
                const aCells = oState.Columns.map(function(oColumnState) {
                    return new Text({
                        text: "{" + this.oMetadataHelper.getProperty(oColumnState.key).path + "}"
                    });
                }.bind(this));
    
                //rebind the table with the updated cell template
                oTable.bindItems({
                    templateShareable: false,
                    path: '/items',
                    sorter: aSorter.concat(aGroups),
                    filters: aFilter,
                    template: new ColumnListItem({
                        cells: aCells
                    })
                });
    
            },
            createFilters: function(oState) {
                const aFilter = [];
                Object.keys(oState.Filter).forEach((sFilterKey) => {
                    const filterPath = this.oMetadataHelper.getProperty(sFilterKey).path;
    
                    oState.Filter[sFilterKey].forEach(function(oConditon) {
                        aFilter.push(new Filter(filterPath, oConditon.operator, oConditon.values[0]));
                    });
                });
    
                this.byId("filterInfo").setVisible(aFilter.length > 0);
    
                return aFilter;
            },
    
            createSorters: function(oState, aExistingSorter) {
                const aSorter = aExistingSorter || [];
                oState.Sorter.forEach(function(oSorter) {
                    const oExistingSorter = aSorter.find(function(oSort) {
                        return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
                    }.bind(this));
    
                    if (oExistingSorter) {
                        oExistingSorter.bDescending = !!oSorter.descending;
                    } else {
                        aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
                    }
                }.bind(this));
    
                oState.Sorter.forEach((oSorter) => {
                    const oCol = this.byId("tblOrder").getColumns().find((oColumn) => oColumn.data("p13nKey") === oSorter.key);
                    if (oSorter.sorted !== false) {
                        oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
                    }
                });
    
                return aSorter;
            },
    
            createGroups: function(oState) {
                const aGroupings = [];
                oState.Groups.forEach(function(oGroup) {
                    aGroupings.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
                }.bind(this));
    
                oState.Groups.forEach((oSorter) => {
                    const oCol = this.byId("tblOrder").getColumns().find((oColumn) => oColumn.data("p13nKey") === oSorter.key);
                    oCol.data("grouped", true);
                });
    
                return aGroupings;
            },
            _getKey: function(oControl) {
                return oControl.data("p13nKey");
            },
            updateColumns: function(oState) {
                const oTable = this.byId("tblOrder");
    
                oTable.getColumns().forEach((oColumn, iIndex) => {
                    oColumn.setVisible(false);
                    oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
                    oColumn.setSortIndicator(coreLibrary.SortOrder.None);
                    oColumn.data("grouped", false);
                });
    
                oState.Columns.forEach((oProp, iIndex) => {
                    const oCol = oTable.getColumns().find((oColumn) => oColumn.data("p13nKey") === oProp.key);
                    oCol.setVisible(true);
    
                    oTable.removeColumn(oCol);
                    oTable.insertColumn(oCol, iIndex);
                });
            },
            openPersoDialog: function(oEvt) {
                this._openPersoDialog(["Columns", "Sorter", "Groups", "Filter"], oEvt.getSource());
            },
            _openPersoDialog: function(aPanels, oSource) {
                var oTable = this.getView().byId("tblOrder");
    
                Engine.getInstance().show(oTable, aPanels, {
                    contentHeight: aPanels.length > 1 ? "50rem" : "35rem",
                    contentWidth: aPanels.length > 1 ? "45rem" : "32rem",
                    source: oSource || oTable
                });
            },
            beforeOpenColumnMenu: function(oEvt) {
                const oMenu = this.byId("menu");
                const oColumn = oEvt.getParameter("openBy");
                const oSortItem = oMenu.getQuickActions()[0].getItems()[0];
                const oGroupItem = oMenu.getQuickActions()[1].getItems()[0];
    
                oSortItem.setKey(this._getKey(oColumn));
                oSortItem.setLabel(oColumn.getHeader().getText());
                oSortItem.setSortOrder(oColumn.getSortIndicator());
    
                oGroupItem.setKey(this._getKey(oColumn));
                oGroupItem.setLabel(oColumn.getHeader().getText());
                oGroupItem.setGrouped(oColumn.data("grouped"));
            },
    
            onColumnHeaderItemPress: function(oEvt) {
                const oColumnHeaderItem = oEvt.getSource();
                let sPanel = "Columns";
                if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
                    sPanel = "Groups";
                } else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
                    sPanel = "Sorter";
                } else if (oColumnHeaderItem.getIcon().indexOf("filter") >= 0) {
                    sPanel = "Filter";
                }
    
                this._openPersoDialog([sPanel]);
            },
    
            onFilterInfoPress: function(oEvt) {
                this._openPersoDialog(["Filter"], oEvt.getSource());
            },
    
            onSort: function(oEvt) {
                const oSortItem = oEvt.getParameter("item");
                const oTable = this.byId("tblOrder");
                const sAffectedProperty = oSortItem.getKey();
                const sSortOrder = oSortItem.getSortOrder();
    
                //Apply the state programatically on sorting through the column menu
                //1) Retrieve the current personalization state
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    //2) Modify the existing personalization state --> clear all sorters before
                    oState.Sorter.forEach(function(oSorter) {
                        oSorter.sorted = false;
                    });
    
                    if (sSortOrder !== coreLibrary.SortOrder.None) {
                        oState.Sorter.push({
                            key: sAffectedProperty,
                            descending: sSortOrder === coreLibrary.SortOrder.Descending
                        });
                    }
    
                    //3) Apply the modified personalization state to persist it in the VariantManagement
                    Engine.getInstance().applyState(oTable, oState);
                });
            },
    
            onGroup: function(oEvt) {
                const oGroupItem = oEvt.getParameter("item");
                const oTable = this.byId("tblOrder");
                const sAffectedProperty = oGroupItem.getKey();
    
                //1) Retrieve the current personalization state
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    //2) Modify the existing personalization state --> clear all groupings before
                    oState.Groups.forEach(function(oSorter) {
                        oSorter.grouped = false;
                    });
    
                    if (oGroupItem.getGrouped()) {
                        oState.Groups.push({
                            key: sAffectedProperty
                        });
                    }
    
                    //3) Apply the modified personalization state to persist it in the VariantManagement
                    Engine.getInstance().applyState(oTable, oState);
                });
            },
    
            onColumnMove: function(oEvt) {
                const oDraggedColumn = oEvt.getParameter("draggedControl");
                const oDroppedColumn = oEvt.getParameter("droppedControl");
    
                if (oDraggedColumn === oDroppedColumn) {
                    return;
                }
    
                const oTable = this.byId("tblOrder");
                const sDropPosition = oEvt.getParameter("dropPosition");
                const iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
                const iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
                const iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
                const sKey = this._getKey(oDraggedColumn);
    
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    const oCol = oState.Columns.find(function(oColumn) {
                        return oColumn.key === sKey;
                    }) || {
                        key: sKey
                    };
                    oCol.position = iNewPos;
    
                    Engine.getInstance().applyState(oTable, {
                        Columns: [oCol]
                    });
                });
            },
    
            onColumnResize: function(oEvt) {
                const oColumn = oEvt.getParameter("column");
                const sWidth = oEvt.getParameter("width");
                const oTable = this.byId("tblOrder");
    
                const oColumnState = {};
                oColumnState[this._getKey(oColumn)] = sWidth;
    
                Engine.getInstance().applyState(oTable, {
                    ColumnWidth: oColumnState
                });
            },
    
            onClearFilterPress: function(oEvt) {
                const oTable = this.byId("tblOrder");
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
                    for (var sKey in oState.Filter) {
                        oState.Filter[sKey].map((condition) => {
                            condition.filtered = false;
                        });
                    }
                    Engine.getInstance().applyState(oTable, oState);
                });
            }
        });
    });
