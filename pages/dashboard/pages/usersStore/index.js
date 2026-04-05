import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  FormGroup,
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
// images
import stop from "../../../../public/assets/img/stop.png";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../../utils/getUserCookies";

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

const ActivatePopup = ({
  setActivatePopup,
  userData,
  loading,
  activateUser,
}) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من تفعيل المستخدم : {userData?.name}</h4>
          <img src={active.src} alt='stop' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={() => activateUser(userData?.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التفعيل ..." : "تفعيل"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setActivatePopup(false)}
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
          <h4>هل انت متاكد من حذف العميل : {userData?.name}</h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => deleteUser(userData?.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الحذف ..." : "حذف"}
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

const Orders = ({ admin }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [addPackagePopup, setAddPackagePopup] = useState(false);
  const [editPopup, setEditPopup] = useState(false);

  const { token } = getUserCookies();
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };

  useEffect(() => {
    fetch(`http://192.34.59.161/api/v1/dashboard/users/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setData(data.results.filter((d) => d.is_staff !== '')));
  }, [search, update]);
  const deleteUser = async (id) => {
    setLoading(true);
    const res = await fetch(`http://192.34.59.161/api/v1/dashboard/users/${id}/`, {
      method: "DELETE",
      headers: {
        // "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    });


    console.log(res);
    if (res.ok) {
      toast.success("تم الحذف بنجاح");
      forceUpdate();
      setDeletePopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);

  };
  const addUser = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    const { title, pass, number } = data;
    const fd = new FormData();

    fd.append("user_type", "CUSTOMER");
    fd.append("name", title);
    fd.append("phone_number", number);
    fd.append("password", pass);
    fd.append("password2", pass);



    const res = await fetch("http://192.34.59.161/api/v1/dashboard/users/", {
      method: "POST",
      body: fd,
      headers: {
        // "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    });

    const result = await res.json();
    console.log(res, result);
    if (res.ok) {
      toast.success("تم الإضافة بنجاح");
      forceUpdate();
      setAddPackagePopup(false);
    } else {
      
      let errorMessage = "حدث خطأ ما";

      // Check if the result contains error messages
      if (result && Object.keys(result).length > 0) {
        errorMessage = Object.keys(result).map(key => {
          const errors = result[key].map(error => error);
          return errors.join('\n');
        }).join('\n');
      }
    
      toast.error(errorMessage);
    }

    setLoading(false);
    e.target.reset();
  };
  const editUser = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    const { title, email, number ,city ,country,nationalId ,file  } = data;
    const fd = new FormData();

    fd.append("user_type", "CUSTOMER");
    fd.append("name", title);
    fd.append("phone_number", number);
    fd.append("email", email);
    fd.append("city", city);
    fd.append("country", country);
    fd.append("national_id", nationalId);
    if (file) {
      fd.append("profile_picture ", file);
    }






    const res = await fetch(`http://192.34.59.161/api/v1/dashboard/users/${userData.id}/`, {
      method: "PATCH",
      body: fd,
      headers: {
        // "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    });

    const result = await res.json();
    console.log(res, result);
    if (res.ok) {
      toast.success("تم الإضافة بنجاح");
      forceUpdate();
      setEditPopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);
    e.target.reset();
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
          href={`/dashboard/pages/users/${row.id}/`}
        >
          {row.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row.phone_number],
      cell: (row) => <div className='font-weight-bold'>{row.phone_number}</div>,
      sortable: true,
    },
    {
      name: "الدولة",
      selector: (row) => [row.country],
      cell: (row) => <div className='font-weight-bold'>{row.country}</div>,
      sortable: true,
    },
    // {
    //   name: "المدينة",
    //   selector: (row) => [row.city],
    //   cell: (row) => <div className='font-weight-bold'>{row.city}</div>,
    //   sortable: true,
    // },
    // {
    //   name: "الهوية",
    //   selector: (row) => [row.national_id],
    //   sortable: true,
    //   cell: (row) => <div>{row.national_id}</div>,
    // },
    // {
    // 	name: "تاريخ التسجيل",
    // 	selector: (row) => [row.Date],
    // 	sortable: true,
    // 	cell: (row) => <div>{row.datetime_created}</div>,
    // },
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
      name: " الهوية",
      selector: (row) => [row.national_id],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.national_id}</span>
        </div>
      ),

      sortable: true,
    },

    // {
    //   name: "مفعّل",
    //   selector: (row) => [row.is_active],
    //   sortable: true,
    //   cell: (row) => (
    //     <div
    //       className='button-list'
    //     // onClick={() => {
    //     //   if (row.is_active) setSuspendPopup(true);
    //     //   else setActivatePopup(true);
    //     //   setUserData(row);
    //     // }}
    //     >
    //       <OverlayTrigger
    //         placement={row.Placement}
    //         overlay={<Tooltip>{row.is_active ? "ايقاف" : "تفعيل"}</Tooltip>}
    //       >
    //         <i className={`ti ti-${row.is_active ? "check" : "close"} btn`}></i>
    //       </OverlayTrigger>
    //     </div>
    //   ),
    // },
    {
      name: "حذف",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            setDeletePopup(true);
            setUserData(row);
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> حذف</Tooltip>}
          >
            <i className='ti ti-trash btn'></i>
          </OverlayTrigger>
        </div>
      ),
    },
    {
      name: "تعديل",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {

            setEditPopup(true);
            setUserData(row);
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
      <Seo title='العملاء' />

      <PageHeader title='العملاء' item='شركة وحيد' active_item='العملاء' />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>

                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto '>
                      العملاء المسجلون
                    </label>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                    <Button
                      onClick={() =>
                        setAddPackagePopup(true)
                      }
                    >
                      إضافة عميل جديد
                    </Button>
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
      {addPackagePopup && (
        <AddPackagePopup
          loading={loading}
          setAddPackagePopup={setAddPackagePopup}
          addUser={addUser}
        />
      )}
      {editPopup && (
        <EditPopup
          loading={loading}
          setEditPopup={setEditPopup}
          editUser={editUser}
          userData={userData}
          token={token}
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
const AddPackagePopup = ({ setAddPackagePopup, addUser, loading }) => {

  const [pass, setPass] = useState(null);
  const [title, setTitle] = useState(null);
  const [number, setNumber] = useState(null);

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3>عميل جديد</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              addUser(e, {
                title,
                number,
                pass,
              })
            }
          >
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الاسم'
                name='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>رقم الجوال</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل رقم الجوال'
                name='number'
                type='tel'
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الرقم السري</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الرقم السري'
                name='password'
                type='text'
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
            </Form.Group>


            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإضافة..." : "إضافة عميل جديد"}
              </Button>
              <Button
                onClick={() => setAddPackagePopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
const EditPopup = ({ setEditPopup, editUser, loading, userData  ,token}) => {
  console.log(userData);
  const [email, setEmail] = useState(userData.email);
  const [title, setTitle] = useState(userData.name);
  const [number, setNumber] = useState(userData.phone_number);
  const [nationalId, setNationalId] = useState(userData.national_id);
  const [country, setCountry] = useState(userData.country);
  const [city, setCity] = useState(userData.city);
  const [file, setFile] = useState(null);
  const [imgUrl, setImgUrl] = useState(
    userData.profile_picture? userData.profile_picture : "https://via.placeholder.com/150"
  );
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  useEffect(() => {
    fetch(`http://192.34.59.161/api/v1/dashboard/countries/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data));

      fetch(`http://192.34.59.161/api/v1/dashboard/cities/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ` ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setCities(data));

  }, []);
  const handleChangeImage = (e) => {
    setFile(e.target.files[0]);
    setImgUrl(URL.createObjectURL(e.target.files[0]));
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-75 d-flex justify-content-center align-items-center pt-5 pb-5'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px",height:'80vh' , overflow:"auto" }}>
        <Card.Header>
          <h3>عميل جديد</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) => {

              editUser(e, {
                title,
                number,
                email,
                file,
                nationalId,
                country,
                city,
              })

            }

            }
          >
            <FormGroup className='form-group mt-5'>
              <Form.Label>الصورة الشخصية</Form.Label>
              <img
                src={imgUrl}
                className='my-3'
                alt='logo'
                height={150}
              />
              <input
                onChange={(e) => handleChangeImage(e)}
                type='file'
                accept='image/png, image/jpeg, image/jpg'
                className='form-control'
              />
            </FormGroup>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الاسم'
                name='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>رقم الجوال</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل رقم الجوال'
                name='number'
                type='tel'
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label> البريد الالكتروني</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل البريد الالكتروني'
                name='password'
                type='text'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formPackage'>
              <Form.Label>اختر الدولة</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='categories'
                value={country} // Assuming you have state for the selected package
                onChange={(e) => setCountry(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر الدولة...</option>
              {
                categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}</option>
                ))
              }
                
              </Form.Select>
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formPackage'>
              <Form.Label>اختر المدينة</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='categories'
                value={city} // Assuming you have state for the selected package
                onChange={(e) => setCity(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر المدينة...</option>
              {
                cities.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}</option>
                ))
              }
                
              </Form.Select>
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>  الهوية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل  الهوية'
                name='password'
                type='text'
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </Form.Group>


            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإضافة..." : " تعديل "}
              </Button>
              <Button
                onClick={() => setEditPopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};