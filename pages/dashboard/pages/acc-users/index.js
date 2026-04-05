import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, OverlayTrigger, Row, Tooltip, FormSelect, Form, Nav } from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import * as XLSX from 'xlsx';
import { Close } from "@mui/icons-material";

import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
// images
import stop from "../../../../public/assets/img/stop.png";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import { toast } from "react-toastify";


const user = getUserCookies();
const SuspendPopup = ({ setSuspendPopup, userData, loading, suspendUser }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من إيقاف المستخدم : {userData?.name}</h4>
          <img src={stop.src} alt='stop' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => suspendUser(userData.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الايقاف ..." : "إيقاف"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSuspendPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};



const DeletePopup = ({ setDeletePopup, userData, loading, deleteUser }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>     في حالة الموافقة لايمكنك اعادة تعيين إلى موظف اخر : {userData?.name}</h4>

          <div className='d-flex justify-content-center gap-5 mt-4'>
            <button
              className='btn btn-lg btn-secondary px-5 '
              onClick={() => deleteUser(userData.customer)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التعين ..." : "تعيين"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setDeletePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const Orders = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [sended, setSended] = useState(false);
  const [sendReq, setSendReq] = useState(false);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checkedList, setCheckedList] = useState([]);
  const [visibleInputs, setVisibleInputs] = useState({});
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const { token, id: adminId, user_type } = user;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowFiles, setIsCanShowFiles] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [activeTab, setActiveTab] = useState("NEW"); // State for active tab
  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'المبيعات'
      );

      console.log('componentPermissions', componentPermissions);
      
      const canAdd = componentPermissions?.some((permission) => permission.display_name == 'مشرف صلاحيات منطقة');
      const canDelete = componentPermissions?.some((permission) => permission.display_name === 'مشرف صلاحيات منطقة');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'مشرف صلاحيات منطقة');
      const canShowFiles = componentPermissions?.some((permission) => permission.display_name === 'مشرف صلاحيات منطقة');
      console.log('canAdd', canAdd);

      setIsCanAdd(canAdd);
      setIsCanDelete(canDelete);
      setIsCanUpdate(canUpdate);
      setIsCanShowFiles(canShowFiles);
    }
  }, [user]);
  const toggleInputVisibility = (rowId) => {
    setVisibleInputs((prevVisibleInputs) => ({
      ...prevVisibleInputs,
      [rowId]: !prevVisibleInputs[rowId], // Toggle visibility for the specific row
    }));
    console.log('visibleInputs', visibleInputs);

  };
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  function reset() {
    setSendReq(false);
    setCheckedList([]);
    setVisibleInputs({});
    setSended(false);
    setSelectedEmployee(null);
  }
  const [selectedStatus, setSelectedStatus] = useState('');
  const [issSendToEmployee, setIsSendToEmployee] = useState('');
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };
  const handleSendToEmployeeChange = (e) => {
    setIsSendToEmployee(e.target.value);
  };
  const getSalesEmployees = async () => {

    const res = await fetch(`${baseUrl}/api/v1/list_sale_employee/`, {


      headers: {
        Authorization: token,

      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    setSalesEmployees(result);
  };
  useEffect(() => {

    user_type === "ADM" || isCanUpdate ? getSalesEmployees() : ''
    if (user_type === "ADM" || user_type === "ACC") {
      //?have_purchases=${selectedStatus}&assigned_to_sale_admin=${issSendToEmployee}&search=${search}&page=${page}&page_size=${perPage}

      fetch(`${baseUrl}/api/v1/accountant-customer/`, {




        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);

          setData(data);
          setTotalRows(data.count);
        });
    }
    if (user_type === "SALE") {


      fetch(`${baseUrl}/api/v1/sale_admin_customer/?status=${activeTab}`, {



        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => setData(data));
    }

  }, [search, selectedStatus, update, isCanUpdate, issSendToEmployee, page, activeTab]);
  const sendPurchacesToSaleEmployee = async () => {
    if (checkedList?.length > 0 && selectedEmployee) {
      setLoading(true);
      const res = await fetch(

        `${baseUrl}/api/v1/accountant-customer/assign-to-sale-admin/`,

        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sale_admin: selectedEmployee,
            customers: checkedList,
          }),
        },
      );
      if (res.status == 401) {
        logout()
      }
      const result = await res.json();
      console.log(result);
      if (result.success) {
        toast.success(`تم إرسال ${checkedList?.length} طلب`);
        forceUpdate();
        reset();
      } else {
        toast.error(result.message || "حدث خطأ ما, حاول مرة اخرى");
      }
      setCheckedList([]);
      setLoading(false);
      setSended(true);
      reset();
    } else {
      toast.error("الرجاء تحديد طلب واحد على الاقل");
      toast.error("الرجاء تحديد الموظف ");
    }
  };
  const deleteUser = async (id) => {
   
      setLoading(true);
      const res = await fetch(

        `${baseUrl}/api/v1/accountant-customer/self-assign/`,

        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // user: selectedEmployee,
            customers: [id],
          }),
        },
      );
      if (res.status == 401) {
        logout()
      }
      const result = await res.json();
      console.log(result);
      if (result.success) {
        toast.success(`تم التعيين بنجاح`);
        setDeletePopup(false);
        forceUpdate();
        reset();
      } else {
        toast.error(result.message || "حدث خطأ ما, حاول مرة اخرى");
      }
      setCheckedList([]);
      setLoading(false);
      setSended(true);
      reset();
   
  };
  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => (
        <span className="d-flex w-100 align-items-center">
          {(user_type === "ADM" || isCanAdd) && sendReq && (
            <>
              <span className="" style={{ width: '10px' }}>{checkedList.indexOf(row.customer) !== -1 ? checkedList.indexOf(row.customer) + 1 : null}</span>

              {
                !row.self_assigned &&
                <input
                  type="checkbox"

                  style={{ width: "25px", height: "20px" }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedList([...checkedList, row?.customer]);
                    } else {
                      setCheckedList(checkedList?.filter((c) => c !== row?.customer));
                    }
                  }}
                  checked={checkedList.includes(row?.customer)}
                />
              }


            </>
          )}
          <Link className='font-weight-bold text-start d-flex align-items-center gap-2 ms-2'
            href={``}
          >
            <span style={{ width: '30px' }}>{!row.customer.id ? row.customer : row.customer.id}</span>
          </Link>

        </span>
      ),
      width: sendReq ? '250px' : '150px'
    },
    {
      name: "الحالة",
      selector: (row) => [row.mobile],
      cell: (row) => <div className='font-weight-bold'>{row?.status}</div>,
      sortable: true,
    },

    {
      name: "الاجرائات",
      selector: (row) => [row.name],
      sortable: true,
      cell: (row) => (
        <div>

          {
            !row.self_assigned &&
            <button className=" btn btn-secondary" onClick={() => {
              setDeletePopup(true);
              setUserData(row);
            }}>
               استلام
            </button>
          }
        </div>
      ),
    },
    {
      name: "الاسم",
      selector: (row) => [row.name],
      sortable: true,
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/users/${row.id}/`}
        >
          {row?.name ? row?.name : row?.customer?.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row.mobile],
      cell: (row) => <div className='font-weight-bold'>{row?.mobile ? row?.mobile : row?.customer?.mobile}</div>,
      sortable: true,
    },
    {
      name: "الهوية",
      selector: (row) => [row.national_id],
      sortable: true,
      cell: (row) => <div>{row?.national_id ? row?.national_id : row?.customer?.national_id}</div>,
    },

    // {
    // 	name: "تاريخ التسجيل",
    // 	selector: (row) => [row.Date],
    // 	sortable: true,
    // 	cell: (row) => <div>{row.datetime_created}</div>,
    // },


    // user_type === "ADM" || isCanUpdate ?



    //   {
    //     name: "مفعّل",
    //     selector: (row) => [row.is_active],
    //     sortable: true,
    //     cell: (row) => (
    //       <div
    //         className='button-list'
    //         onClick={() => {
    //           if (row.is_active) setSuspendPopup(true);
    //           else setActivatePopup(true);
    //           setUserData(row);
    //         }}
    //       >
    //         <OverlayTrigger
    //           placement={row.Placement}
    //           overlay={<Tooltip>{row.is_active ? "ايقاف" : "تفعيل"}</Tooltip>}
    //         >
    //           <i className={`ti ti-${row.is_active ? "check" : "close"} btn`}></i>
    //         </OverlayTrigger>
    //       </div>
    //     ),
    //   }
    //   : '',
    // user_type === "ADM" || isCanDelete ?
    //   {
    //     name: "حذف",
    //     selector: (row) => [row.ACTIONS],
    //     cell: (row) => (
    //       <div
    //         className='button-list '
    //         onClick={() => {
    //           setDeletePopup(true);
    //           setUserData(row);
    //         }}
    //       >
    //         <OverlayTrigger
    //           placement={row.Placement}
    //           overlay={<Tooltip> حذف</Tooltip>}
    //         >
    //           <i className='ti ti-trash btn'></i>
    //         </OverlayTrigger>
    //       </div>
    //     ),
    //   }
    //   :
    //   ''
    // ,
  ];
  console.log(data);
  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='المبيعات' />

      <PageHeader title='المبيعات' item='شركة وحيد' active_item='المبيعات' />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                {
                  user_type === "SALE" &&
                  <Nav

                    variant="tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4 w-50"
                  >
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="NEW"
                        className={activeTab === "NEW" ? "active bg-primary text-white" : ""}
                      >
                        العملاء الجدد
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="OLD"
                        className={activeTab === "OLD" ? "active bg-primary text-white" : ""}
                      >
                        عملاء سابقون
                      </Nav.Link>
                    </Nav.Item>

                  </Nav>
                }
                <div style={{ marginBottom: "0px" }}>

                  <div className='d-flex justify-content-between  flex-wrap'>
                    <label className='main-content-label my-auto '>
                      المبيعات
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>

                      </button>

                    </label>
                    <div className="gap-2 d-flex">

                      {user_type === "ADM" || isCanUpdate ?
                        (sendReq ? (
                          <div className="mt-2 mt-md-0">
                            <div className='d-flex gap-3 align-items-center'>
                              <h5 className='font-weight-bold'>
                                {checkedList?.length < 1
                                  ? "يجب تحديد العملاء"
                                  : ` عدد العملاء (${checkedList?.length})`}
                              </h5>
                              <Button
                                disabled={
                                  loading ||
                                    checkedList?.length < 1 ||
                                    !selectedEmployee
                                    ? true
                                    : false
                                }
                                onClick={sendPurchacesToSaleEmployee}
                              >
                                {loading ? "جاري الإرسال..." : "إرسال العملاء"}
                              </Button>
                              <button
                                onClick={reset}
                                variant='danger'
                                style={{
                                  background: "red",
                                  width: 30,
                                  height: 30,
                                }}
                                className='d-flex justify-content-center align-items-center rounded-circle p-0 text-white border-0'
                              >
                                <Close fontSize='small' />
                              </button>
                            </div>
                            <div>
                              <FormSelect
                                className='mt-3 ps-5'
                                value={selectedEmployee}
                                onChange={(e) =>
                                  setSelectedEmployee(e.target.value)
                                }
                              >
                                <option value={null} selected>
                                  اختر الموظف
                                </option>
                                {salesEmployees?.map((employee) => (
                                  <option key={employee?.id} value={employee?.id}>
                                    {employee?.name}
                                  </option>
                                ))}
                              </FormSelect>
                            </div>
                          </div>
                        ) : (
                          <Button className="mt-2 mt-md-0" onClick={() => setSendReq(true)}>
                            تعيين عملاء لموظف المبيعات
                          </Button>
                        ))
                        :
                        ''
                      }

                      <Button className="mt-2 mt-md-0 ms-md-2" onClick={exportToExcel}>Export to Excel</Button>
                    </div>



                  </div>
                  {
                    user_type === "ADM" &&

                    <div className="d-flex justify-content-start flex-wrap gap-2 mt-4">

                      <Form.Group className='text-start form-group  ' controlId='formPackage'>
                        <Form.Label> فرز عن طرق عمليات الشراء</Form.Label>
                        <Form.Select
                          className='form-control ps-5 text-muted'
                          name='categories'
                          value={selectedStatus} // Assuming you have state for the selected package
                          onChange={(e) => handleStatusChange(e)}
                          required
                        >
                          {/* Placeholder option */}

                          <option value=""> الكل...</option>
                          <option value="false">ليس لديه عمليات شراء  </option>
                          <option value="true">  لديه عمليات شراء</option>



                        </Form.Select>
                      </Form.Group>
                      <Form.Group className='text-start form-group   ' controlId='formPackage'>
                        <Form.Label> فرز    الموظفين الذين تم إرسالهم إلى موظف المبيعات</Form.Label>
                        <Form.Select
                          className='form-control ps-5 text-muted'
                          name='categories'
                          value={issSendToEmployee} // Assuming you have state for the selected package
                          onChange={(e) => handleSendToEmployeeChange(e)}
                          required
                        >
                          {/* Placeholder option */}

                          <option value=""> الكل...</option>
                          <option value="true">   تم إرسالهم إلى موظف   </option>
                          <option value="false">    لم يتم إرسالهم</option>



                        </Form.Select>
                      </Form.Group>

                    </div>
                  }

                </div>

              </Card.Header>


              <Card.Body className="pos-relative">
                {
                  user_type === "ADM" ?
                    <input
                      type='text'
                      className='search-input'
                      style={{ top: '30px' }}
                      placeholder='بحث'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    /> : ''
                }
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={(page) => setPage(page)}
                    paginationPerPage={perPage}
                    onChangeRowsPerPage={(newPerPage, page) => {
                      setPerPage(newPerPage);
                      setPage(page);
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
      {suspendPopup && (
        <SuspendPopup
          loading={loading}
          setSuspendPopup={setSuspendPopup}
          userData={userData}
          suspendUser={suspendUser}
        />
      )}
      {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteUser={deleteUser}
        />
      )}
      {/* {activatePopup && (
        <ActivatePopup
          loading={loading}
          setActivatePopup={setActivatePopup}
          userData={userData}
          activateUser={activateUser}
        />
      )} */}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
