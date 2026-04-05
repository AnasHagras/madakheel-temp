import React, { useEffect, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  Nav,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
// images
import * as XLSX from 'xlsx';
import checkUserType from "../../../../utils/checkUserType";
import { useRouter } from "next/router";
import Select from 'react-select';

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([
    {
      id: "1",
      label: "Record Label 1",
      action: "create",
      changes: "Added new item",
      created_at: "2024-10-31T12:00:00Z",
      user_name: "John Doe",
      user_mobile: "+1234567890",
      reference_object_type: "Item",
      reference_object_id: "101"
    },
    {
      id: "2",
      label: "Record Label 2",
      action: "update",
      changes: "Updated item details",
      created_at: "2024-10-30T15:30:00Z",
      user_name: "Jane Smith",
      user_mobile: "+0987654321",
      reference_object_type: "Category",
      reference_object_id: "202"
    },
  ]);

  const [search, setSearch] = useState('');
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [filter, filterUpdate] = useReducer((x) => x + 1, 0);
  const router = useRouter();
  const { type } = router.query;
  const { token, id, user_type } = user;

  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [users, setUsers] = useState([]);
  const dropdownRef = useRef(null); // Ref for the dropdown container
  const [showDropdown, setShowDropdown] = useState(false); // Toggle dropdown visibility
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
    // Click outside handler
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  // filter type 
  const filterData = [
    {
      id: 'CUSTOMER',
      name: "مستخدم",
    },
    {
      id: 'PURCHASE',
      name: "عملية شراء",
    },
    {
      id: 'PACKAGE',
      name: "باقة",
    },
    {
      id: 'SALE',
      name: "عملية بيع",
    },
  ];

  const filterOptions = filterData.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  const handleChangeFilter = (selectedOption) => {


    setSelectedFilter(selectedOption);
  };

  // users or puraches
  const handleChange = (selectedOption) => {
    console.log(selectedOption);
    setSelectedEmployee(selectedOption);
  };
  console.log('users', users);

  // const options = users.map((user) => ({
  //   value: user.id,
  //   label: selectedFilter?.value == 'SALE' ? `عملية بيع رقم ${user.id}` : user.name || user.title || `عملية شراء رقم ${user.id}`,

  // }));


  const options = users.map((user) => ({
    value: user.id,
    label: selectedFilter?.value == 'SALE' ? `عملية بيع رقم ${user.id}` : user.name || user.title || `عملية شراء رقم ${user.id}`,
    user_name: user.name,
    user_mobile: user.mobile,
  }));
  console.log('options', options);
  // record type 
  const handleChangeType = (selectedOption) => {
    console.log('selectedOption', selectedOption);
    setSelectedOrderType(selectedOption);
  };
  const [typeOption, setTypeOptions] = useState([
    {
      id: 'create',
      name: "إضافة",
    },
    {
      id: 'update',
      name: "تعديل",
    },
    {
      id: 'delete',
      name: "حذف",
    },
  ]);
  const typeOptions = typeOption.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: state.isFocused ? '1px solid #e8e8f7' : '1px solid #e8e8f7',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#e8e8f7',
      },
      direction: 'ltr'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#ced4da',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#e9ecef' : 'white',
      color: 'black',
      '&:hover': {
        backgroundColor: '#ced4da',
      },
      '&:active': {
        backgroundColor: '#ced4da',
      },
    }),
  };
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };

  // useEffect(() => {
  //   setUsers([])
  //   // if (search.length < 2) {
  //   //   // If search term is less than 3 characters, do nothing
  //   //   if(search.length == 0){
  //   //     setSearch('')
  //   //   }
  //   //   else  return ;
  //   // }
  //   if (search != "") {

  //     if (selectedFilter?.value == 'CUSTOMER') {

  //       fetch(`${baseUrl}/api/v1/get_customer/?page_size=${10}&search=${search}`, {
  //         headers: {
  //           Authorization: ` ${user.token}`,
  //         },
  //       })
  //         .then((res) => {
  //           if (res.status === 401) {
  //             logout();
  //             return;
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           data.results && setUsers(data.results.filter((d) => d.user_type === "CUS"));
  //         });
  //     }
  //     if (selectedFilter?.value == 'PURCHASE') {

  //       fetch(`${baseUrl}/api/v1/get_new_purchases/?page_size=${10}&admin_id=${user.id}&search=${search}`, {
  //         headers: {
  //           Authorization: ` ${user.token}`,
  //         },
  //       })
  //         .then((res) => {
  //           if (res.status === 401) {
  //             // logout();
  //             return;
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           data.results && setUsers(data.results);
  //         });
  //     }
  //     if (selectedFilter?.value == 'PACKAGE') {

  //       fetch(`${baseUrl}/api/v1/package_search/?page_size=${10}&admin_id=${user.id}&search=${search}`, {
  //         headers: {
  //           Authorization: ` ${user.token}`,
  //         },
  //       })
  //         .then((res) => {
  //           if (res.status === 401) {
  //             logout();
  //             return;
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           data.results && setUsers(data.results);
  //         });
  //     }
  //     if (selectedFilter?.value == 'SALE') {

  //       fetch(`${baseUrl}/api/v1/admin_sale/?page_size=${10}&admin_id=${user.id}&search=${search}`, {
  //         headers: {
  //           Authorization: ` ${user.token}`,
  //         },
  //       })
  //         .then((res) => {
  //           if (res.status === 401) {
  //             logout();
  //             return;
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           data.results && setUsers(data.results);
  //         });
  //     }
  //   }




  // }, [selectedFilter, search]);


  useEffect(() => {
    setUsers([]);
    if (search.trim() === "") {
      setShowDropdown(false);
      return;
    }

    let url = "";
    switch (selectedFilter?.value) {
      case "CUSTOMER":
        url = `${baseUrl}/api/v1/get_customer/?page_size=${10}&search=${search}`;
        break;
      case "PURCHASE":
        url = `${baseUrl}/api/v1/get_new_purchases/?page_size=${10}&admin_id=${user.id}&search=${search}`;
        break;
      case "PACKAGE":
        url = `${baseUrl}/api/v1/package_search/?page_size=${10}&admin_id=${user.id}&search=${search}`;
        break;
      case "SALE":
        url = `${baseUrl}/api/v1/admin_sale/?page_size=${10}&admin_id=${user.id}&search=${search}`;
        break;
      default:
        return;
    }

    fetch(url, {
      headers: { Authorization: `${user.token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data.results) {
          setUsers(
            selectedFilter?.value === "CUSTOMER"
              ? data.results.filter((d) => d.user_type === "CUS")
              : data.results
          );
          setShowDropdown(true); // Show dropdown when results exist
        }
      });
  }, [search, selectedFilter]);
  useEffect(() => {
    if (!urlInitRef.current) return;
    setIsLoading(true);
    const seq = (requestSeqRef.current += 1);
    const controller = new AbortController();
    let apiUrl = "";
    const params = {
      object_id: selectedEmployee?.id ? selectedEmployee?.id : '',
      action: selectedOrderType?.value ? selectedOrderType?.value : '',
      object_type: selectedFilter?.value || '',
      page: currentPage,
      page_size: perPage,
    };
    apiUrl = `${baseUrl}/api/v1/history/?${new URLSearchParams(params).toString()}`;
    fetch(apiUrl, {
      headers: { "Content-Type": "application/json", Authorization: user.token },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (seq !== requestSeqRef.current) return; // stale
        setData(data.results || []);
        setTotalRows(data.count || 0);
        setIsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Error fetching records:', err);
        setData([]);
        setTotalRows(0);
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [selectedOrderType, selectedEmployee, selectedFilter, currentPage, perPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOrderType, selectedEmployee, selectedFilter]);

  // Initialize from URL on first load (apply to state first)
  useEffect(() => {
    if (typeof window === 'undefined' || urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const qObjectType = params.get('object_type');
    const qAction = params.get('action');
    const qObjectId = params.get('object_id');
    const qObjectName = params.get('object_name');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');

    if (typeof qObjectType === 'string' && qObjectType.length > 0) {
      const match = filterOptions.find(o => o.value === qObjectType);
      if (match && match.value !== selectedFilter?.value) setSelectedFilter(match);
    }
    if (typeof qAction === 'string' && qAction.length > 0) {
      const match = typeOptions.find(o => o.value === qAction);
      if (match && match.value !== selectedOrderType?.value) setSelectedOrderType(match);
    }
    if (qObjectId && !Number.isNaN(Number(qObjectId))) {
      const nextId = Number(qObjectId);
      // If CUSTOMER and a friendly name is provided in URL, use it directly to fill the input
      if (qObjectType === 'CUSTOMER' && typeof qObjectName === 'string' && qObjectName.length > 0) {
        if (selectedEmployee?.id !== nextId || selectedEmployee?.name !== qObjectName) {
          setSelectedEmployee({ id: nextId, name: qObjectName });
        }
        if (!search) setSearch(qObjectName);
      } else {
        if (selectedEmployee?.id !== nextId) setSelectedEmployee({ id: nextId, name: `ID ${qObjectId}` });
        if (!search) setSearch(`ID ${qObjectId}`);
      }
    }
    if (qPage && !Number.isNaN(Number(qPage))) {
      const next = Number(qPage);
      if (next !== currentPage) setCurrentPage(next);
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      const next = Number(qPageSize);
      if (next !== perPage) setPerPage(next);
    }

    didInitFromUrlRef.current = true;
  }, []);

  // After URL params have been applied to state, enable fetching once
  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      filterUpdate();
    }
  }, [selectedFilter, selectedOrderType, selectedEmployee, currentPage, perPage]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (currentPage && currentPage !== 1) nextQuery.page = String(currentPage);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    if (selectedFilter?.value) nextQuery.object_type = selectedFilter.value;
    if (selectedOrderType?.value) nextQuery.action = selectedOrderType.value;
    if (selectedEmployee?.id) nextQuery.object_id = String(selectedEmployee.id);
    // If type is CUSTOMER, persist the friendly name so input hydrates correctly on refresh
    if (selectedFilter?.value === 'CUSTOMER' && selectedEmployee?.name) {
      nextQuery.object_name = selectedEmployee.name;
    }
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [currentPage, perPage, selectedFilter, selectedOrderType, selectedEmployee]);

  // Hydrate search input from params with human-friendly label for the selected object
  useEffect(() => {
    if (!urlInitRef.current) return;
    if (!selectedFilter?.value || !selectedEmployee?.id) return;
    // If search already looks filled (not just ID placeholder), skip
    if (search && !/^ID\s+\d+$/i.test(search)) return;

    let url = "";
    const entityId = selectedEmployee.id;
    switch (selectedFilter.value) {
      case "CUSTOMER":
        url = `${baseUrl}/api/v1/get_customer/?page_size=1&search=${entityId}`;
        break;
      case "PURCHASE":
        url = `${baseUrl}/api/v1/get_new_purchases/?page_size=1&admin_id=${user.id}&search=${entityId}`;
        break;
      case "PACKAGE":
        url = `${baseUrl}/api/v1/package_search/?page_size=1&admin_id=${user.id}&search=${entityId}`;
        break;
      case "SALE":
        url = `${baseUrl}/api/v1/admin_sale/?page_size=1&admin_id=${user.id}&search=${entityId}`;
        break;
      default:
        return;
    }

    fetch(url, { headers: { Authorization: `${user.token}` } })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const results = data.results || data.data || [];
        const exact = Array.isArray(results) ? results.find((r) => (r?.id ?? r?.user?.id) == entityId) : null;
        const item = exact || (Array.isArray(results) ? results[0] : null);
        if (!item) return;

        let label = `ID ${entityId}`;
        if (selectedFilter.value === "CUSTOMER") {
          label = item.name || label;
        } else if (selectedFilter.value === "PACKAGE") {
          label = item.title || label;
        } else if (selectedFilter.value === "PURCHASE") {
          label = `عملية شراء رقم ${item.id}`;
        } else if (selectedFilter.value === "SALE") {
          label = `عملية بيع رقم ${item.id}`;
        }
        setSearch(label);
        // keep dropdown closed on hydrate
        setShowDropdown(false);
      })
      .catch(() => {});
  }, [selectedFilter, selectedEmployee]);
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1)
  };


  // const handleInputChange = (inputValue) => {
  //   setSearch(inputValue); // Call the onSearch function to update search term
  // };
  const handleInputChange = (e) => {
    setSearch(e.target.value);
  };
  const handleSelect = (user) => {
    setSelectedEmployee(user);
    setSearch(user.name || user.title || `عملية رقم ${user.id}`);
    setShowDropdown(false);
  };
  const columns = [
    {
      name: "المعرف",
      selector: (row) => row.id,
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>
          <span>{row.id}</span>
        </div>
      ),
      width: "100px"
    },
    {
      name: "العملية",
      selector: (row) => row.label,
      cell: (row) => (
        <span className='font-weight-bold'>
          {row.label}
        </span>
      ),
      sortable: true,
      width: '200px'
    },
    {
      name: "نوع العملية",
      selector: (row) => row.action,
      cell: (row) => (
        <span>
          {row.action}
        </span>
      ),
      sortable: true,
      width: '140px'
    },
    {
      name: "التغييرات",
      selector: (row) => row.changes,
      cell: (row) => (
        <span>
          {row.changes}
        </span>
      ),
      sortable: true,
      width: '200px'
    },
    {
      name: "التاريخ والوقت",
      selector: (row) => row.created_at,
      cell: (row) => (
        <span>
          {row.created_at}
        </span>
      ),
      sortable: true,
      width: '180px'
    },
    {
      name: "المستخدم",
      selector: (row) => row.user_name,
      cell: (row) => (
        <span>
          {row.user_name}
        </span>
      ),
      sortable: true,
      width: '140px'
    },
    {
      name: "الجوال",
      selector: (row) => row.user_mobile,
      cell: (row) => (
        <span>
          {row.user_mobile}
        </span>
      ),
      sortable: true,
      width: '140px'
    },
    {
      name: "نوع المتأثر",
      selector: (row) => row.reference_object_type,
      cell: (row) => (
        <span>
          {row.reference_object_type}
        </span>
      ),
      sortable: true,
      width: '160px'
    },
    {
      name: "المتأثر",
      selector: (row) => row.reference_object_id,
      cell: (row) => (
        <span>
          {row.reference_object_id}
        </span>
      ),
      sortable: true,
      width: '120px'
    }
  ];



  const tableData = {
    columns,
    data,
  };

  const isAdmin = checkUserType();



  return (
    <>
      <Seo title=' السجلات' />

      <PageHeader title=' السجلات' item='شركة وحيد ' active_item=' السجلات' />

      <div>

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card ' >

              <Card.Header className=' border-bottom-0 pb-10'>
                <div style={{ marginBottom: "-5px" }}>


                  <div className='d-flex justify-content-start align-items-center flex-wrap rpw'>


                    <Form.Group className='text-start form-group col-md-4 col-12' controlId='formPackage'>
                      <Form.Label>   نوع الفلتر </Form.Label>
                      <Select
                        className=' text-muted border-0'
                        value={selectedFilter}
                        onChange={handleChangeFilter}
                        options={filterOptions}
                        placeholder="اختر ..."
                        isClearable
                        isSearchable
                        styles={customStyles} // Apply custom styles
                      />
                    </Form.Group>
                    {/* {
                      selectedFilter &&
                      <Form.Group className='text-start form-group col-md-4 col-12' controlId='formPackage'>
                        <Form.Label>   العملية </Form.Label>
                        <Select
                          className=' text-muted border-0'
                          value={selectedEmployee}
                          onChange={handleChange}
                          options={options}
                          onInputChange={handleInputChange}
                          placeholder="بحث بالاسم او رقم العملية ..."
                          isClearable
                          isSearchable
                          styles={customStyles} // Apply custom styles
                        />
                      </Form.Group>
                    } */}
                    {
                      selectedFilter &&
                      <Form.Group className='text-start form-group col-md-4 col-12' controlId='formPackage' ref={dropdownRef}>
                        <Form.Label>   العملية </Form.Label>
                       
                        <input
                          id="search-input"
                          type="text"
                          className="form-control"
                          placeholder="بحث بالاسم او رقم العملية ..."
                          value={search}
                          onChange={handleInputChange}
                        />

                        {/* Dropdown Results */}
                        {showDropdown && (
                          <div
                            className="dropdown-menu w-100 show"
                            style={{ maxHeight: "200px", overflowY: "auto"  }}
                          >
                            {users.length > 0 ? (
                              users.map((user) => (
                                <button
                                  key={user.id}
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => handleSelect(user)}
                                >
                                  {selectedFilter?.value === "SALE"
                                    ? `عملية بيع رقم ${user.id}`
                                    : user.name || user.title || `عملية شراء رقم ${user.id}`}
                                </button>
                              ))
                            ) : (
                              <div className="dropdown-item text-muted">لا توجد نتائج</div>
                            )}
                          </div>
                        )}
                      </Form.Group>
                    }
                    {
                      selectedEmployee &&
                      <Form.Group className='text-start form-group col-md-4 col-12' controlId='formPackage'>
                        <Form.Label>  نوع العملية </Form.Label>
                        <Select
                          className=' text-muted border-0'
                          value={selectedOrderType}
                          onChange={handleChangeType}
                          options={typeOptions}
                          placeholder="اختر ..."
                          isClearable
                          isSearchable
                          styles={customStyles} // Apply custom styles
                        />
                      </Form.Group>
                    }
                    <Button className="me-2" onClick={exportToExcel}>تصدير اكسيل  </Button>


                  </div>

                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ overflowX: 'auto ' }}>

                  <DataTableExtensions {...tableData}>
                    <DataTable
                      columns={columns}
                      data={data}
                      pagination
                      paginationServer
                      paginationTotalRows={totalRows}
                      paginationDefaultPage={currentPage}
                      onChangeRowsPerPage={handlePerRowsChange}
                      onChangePage={handlePageChange}
                      paginationPerPage={perPage}
                      paginationRowsPerPageOptions={[50]}
                      defaultSortAsc={false}
                      // responsive={false}
                      style={{ minWidth: '800px' }}
                      progressPending={isLoading || !urlInitRef.current}
                      progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
                    />
                  </DataTableExtensions>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>



    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

