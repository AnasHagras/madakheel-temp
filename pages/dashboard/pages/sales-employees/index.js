import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
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
import * as XLSX from 'xlsx';
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { toast } from "react-toastify";
// images
import stop from "../../../../public/assets/img/stop.png";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import Select from 'react-select';
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [createEmployeePopup, setCreateEmployeePopup] = useState(false);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id, user_type } = user;
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [errors, setErrors] = useState({}); // State to hold field-specific errors
  const [isAddNew, setIsAddNew] = useState(true);
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'موظفو المبيعات'
      );

      console.log('componentPermissions', componentPermissions);

      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
      const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');


      setIsCanAdd(canAdd);
      setIsCanDelete(canDelete);
      setIsCanUpdate(canUpdate);

    }
  }, [user]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/list_sale_employee/`, {

      headers: {

        Authorization: `${token}`,
      },

    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => setData(data));
  }, [update]);

  const createEmployee = async (data) => {
    const { mobile, email, national_id, name, secret, sale_accountant ,country_code ,contact} = data;
    console.log(data);
    
    const res = await fetch(`${baseUrl}/api/v1/${isAddNew ? 'sale_employee' : 'list_sale_employee'}/${!isAddNew ? userData.id + '/' : ""}`, {
      method: isAddNew ? "POST" : "PATCH",
      body: JSON.stringify({ mobile, email, national_id, name, secret,sale_admin_contact_number :contact , sale_accountant ,country_code }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    });
    if (res.status === 401) {
      logout();
    }
    const result = await res.json();
    console.log(result, res);
    if ((res.status === 201 || res.status === 200)) {
      toast.success("تمت العملية بنجاح");
      setCreateEmployeePopup(false);
      forceUpdate();
    } else {
      // Handle errors
      const fieldErrors = {};
      if (result.message) {
        // Check if the message contains field-specific errors
        if (result.message && typeof result.message === "object") {
          Object.keys(result.message).forEach((field) => {
            fieldErrors[field] = result.message[field][0]; // Display the first error message for each field
          });
        } else {
          // If the error is a general message, show it in a toast
          toast.error(result.message);
        }

        setErrors(fieldErrors);
      } else {
        toast.error("An unknown error occurred.");
      }
    }
  };


  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "الاسم",
      selector: (row) => [row.name],
      sortable: true,
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/sales-employees/${row.id}/`}
        >
          {row.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row.mobile],
      cell: (row) => <div className='font-weight-bold'>{row.mobile}</div>,
      sortable: true,
    },
    {
      name: "رقم التواصل",
      selector: (row) => [row.sale_admin_contact_number ],
      cell: (row) => <div className='font-weight-bold'>{row.sale_admin_contact_number }</div>,
      sortable: true,
    },
    {
      name: "الهوية",
      selector: (row) => [row.national_id],
      sortable: true,
      cell: (row) => <div>{row.national_id}</div>,
    },

    {
      name: "البريد الالكتروني",
      selector: (row) => [row.email],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.email}</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "تعديل",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            if (user_type === "ADM" || isCanUpdate) {

              setIsAddNew(false)
              setCreateEmployeePopup(true);
              setUserData(row);
            }
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> تعديل</Tooltip>}
          >
            <i className='ti ti-pencil btn'></i>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='موظفو المبيعات' />

      <PageHeader
        title='موظفو المبيعات'
        item='شركة وحيد'
        active_item='موظفو المبيعات'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div
                  className='d-flex justify-content-between'
                  style={{ marginBottom: "15px" }}
                >
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto '>
                      موظفو المبيعات
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                  </div>
                  <div className="d-flex flex-wrap gap-2">

                    {
                      user_type === "ADM" || isCanAdd ?

                        <Button onClick={() => {
                          setIsAddNew(true)
                          setCreateEmployeePopup(true);
                        }}>
                          انشاء موظف جديد
                        </Button>
                        : ''
                    }
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                  </div>

                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationPerPage={200}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>

      {createEmployeePopup && (
        <CreateEmployeePopup
          setCreateEmployeePopup={setCreateEmployeePopup}
          createEmployee={createEmployee}
          errors={errors}
          setErrors={setErrors}
          rowData={userData}
          isAddNew={isAddNew}
        />
      )}

      {/* {suspendPopup && (
        <SuspendPopup
          loading={loading}
          setSuspendPopup={setSuspendPopup}
          userData={userData}
          suspendUser={suspendUser}
        />
      )} */}
      {/* {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteUser={deleteUser}
        />
      )} */}
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

const CreateEmployeePopup = ({ setCreateEmployeePopup, createEmployee, setErrors, errors, isAddNew, rowData, }) => {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(isAddNew ? '' : rowData.name);
  const [email, setEmail] = useState(isAddNew ? '' : rowData.email);
  const [mobile, setMobile] = useState(isAddNew ? '' : rowData.mobile);
  const [contact, setContact] = useState(isAddNew ? '' : rowData.sale_admin_contact_number );
  const [national_id, setNationalId] = useState(isAddNew ? '' : rowData.national_id);
  const [secret, setSecret] = useState(undefined);
  const [users, setUsers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [countryCode, setCountryCode] = useState([]);
  const [selectedCode, setSelectedCode] = useState(1); // Default to Saudi Arabia
  useEffect(() => {


    const fetchCountryCode = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/country-code/`, {

        });
        const data = await res.json();
        console.log(data);

        setCountryCode(data);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryCode();
  }, []);
  useEffect(() => {

    fetch(`${baseUrl}/api/v1/get_accountant/?have_sales_permission=`, {
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
        setUsers(data);
      });





  }, []);

  const options = users.map((user) => ({
    value: user.id,
    label: user.name,

  }));
  useEffect(() => {
    setSelectedEmployee(isAddNew ? null : options.find((op) => op.value === rowData.sale_accountant))

  }, [users]);
  const handleChange = (selectedOption) => {
    console.log(selectedOption);
    setSelectedEmployee(selectedOption);
  };
console.log("selectedEmployee" ,selectedEmployee);

  const data = {
    name,
    email,
    mobile,
    national_id,
    country_code: JSON.parse(selectedCode),
    secret,
    contact,

    sale_accountant: selectedEmployee?.value
  };
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // Clear previous errors
    await createEmployee(data);
    setLoading(false);
  }
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
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className="pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center"
    >
      <Card style={{ width: "60%", minWidth: "350px", maxWidth: "600px", marginTop: '70px' ,height:'80vh' ,overflow:'auto' }} >
        <Card.Header>

          <h3>{isAddNew ? "إنشاء موظف جديد" : "تعديل الموظف"}</h3>
        </Card.Header>
        <Form onSubmit={handleSubmit}>
          <Card.Body>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="ادخل اسم الموظف"
                isInvalid={!!errors.name}
              />
              {errors.name && (
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>البريد الالكتروني</Form.Label>
              <Form.Control
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="ادخل البريد الالكتروني"
                isInvalid={!!errors.email}
              />
              {errors.email && (
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="formMobile">
              <Form.Label>الجوال</Form.Label>
              <div className="d-flex gap-1">
                <Form.Select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="form-control w-25"
                  style={{ paddingRight: '35px', paddingLeft: "5px" }}
                >
                  {countryCode.map((country) => (
                    <option key={country.id} value={country.id} className="p-4">
                      ({country.code})
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="number"
                  min={0}
                  placeholder="ادخل  جوال الموظف"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  isInvalid={!!errors.mobile}
                />
              </div>

              {errors.mobile && (
                <Form.Control.Feedback type="invalid">
                  {errors.mobile}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNationalId">
              <Form.Label>رقم التواصل</Form.Label>
              <Form.Control
                type="number"
                min={0}
                placeholder="ادخل   رقم التواصل"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                
              />
       
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNationalId">
              <Form.Label>الهوية</Form.Label>
              <Form.Control
                type="number"
                min={0}
                placeholder="ادخل  هوية الموظف"
                value={national_id}
                onChange={(e) => setNationalId(e.target.value)}
                isInvalid={!!errors.national_id}
              />
              {errors.national_id && (
                <Form.Control.Feedback type="invalid">
                  {errors.national_id}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className='text-start form-group ' controlId='formPackage'>
              <Form.Label>   المشرف المسؤل عنه </Form.Label>
              <Select
                className=' text-muted border-0'
                value={selectedEmployee}
                onChange={handleChange}
                options={options}
                placeholder="اختر ..."
                isClearable
                isSearchable
                styles={customStyles} // Apply custom styles
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formSecret">
              <Form.Label>كلمة المرور</Form.Label>
              <Form.Control
                type="password"
                placeholder="ادخل كلمة المرور للموظف"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                isInvalid={!!errors.secret}
              />
              {errors.secret && (
                <Form.Control.Feedback type="invalid">
                  {errors.secret}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Card.Body>
          <Card.Footer>
            <Button type="submit" variant="primary px-5" disabled={loading}>

              {loading ? "جار المعالجة ..." : (isAddNew ? "إنشاء الموظف" : "تحديث الموظف")}
            </Button>
            <Button
              variant="outline-light px-5 text-dark"
              onClick={() => setCreateEmployeePopup(false)}
              className="ms-4"
              type="button"
            >
              الغاء
            </Button>
          </Card.Footer>
        </Form>
      </Card>
    </div>
  );
};
