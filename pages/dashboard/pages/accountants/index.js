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
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

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
          <h4>هل انت متاكد من حذف المشرف : {userData?.name}</h4>
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

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [addAccountantPopup, setAddAccountantPopup] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
 

  useEffect(() => {
    const componentPermissions = user?.permissions?.filter(
      (permission) => permission.group_name === 'المحاسبون'
    );
  
    const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
    const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
    const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
  
    setIsCanAdd(canAdd);
    setIsCanDelete(canDelete);
    setIsCanUpdate(canUpdate);

  }, [user]);
  
  // const { token, id, user_type } = user;
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_accountant/?have_sales_permission=`,{
      headers: {
     
        Authorization: `${user.token}`,
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
  }, [update]);

  const addAccountant = async (e, data) => {
    e.preventDefault();

    const { name, nationalId, mobile, secret, email } = data;

    if (nationalId.length < 9) {
      toast.error("الهوية يجب أن تكون أكبر من 9 خانات");
      return;
    }
    if (mobile.length !== 9) {
      toast.error("الجوال يجب أن يكون 9 خانات");
      return;
    }
    if (secret.length < 8) {
      toast.error("كلمة المرور يجب أن تكون أكبر من 8 خانات");
      return;
    }
    setLoading(true);
    const res = await fetch(`${baseUrl}/api/v1/accountant/`, {
      method: "POST",
      body: JSON.stringify({
        name,
        national_id: nationalId,
        mobile,
        secret,
        email,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.token}`,
      },
    });
    if(res.status == 401){
      logout()
    }
    const result = await res.json();
    if (res.ok && result.success) {
      toast.success("تم إنشاء المحاسب بنجاح");
      setAddAccountantPopup(false);
      forceUpdate();
    } else {
      if (result.message) toast.error(result.message);
      if (result.message.mobile) toast.error(result.message.mobile[0]);
      if (result.message.secret) toast.error(result.message.secret[0]);
      if (result.message.national_id)
        toast.error(result.message.national_id[0]);
      if (result.message.email) toast.error(result.message.email[0]);
      if (result.message) toast.error(result.message);
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
          href={`/dashboard/pages/accountants/${row.id}/`}
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
      name: "مفعّل",
      selector: (row) => [row.is_active],
      sortable: true,
      cell: (row) => (
        <div
          className='button-list'
          onClick={() => {
            if (row.is_active) setSuspendPopup(true);
            else setActivatePopup(true);
            setUserData(row);
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip>{row.is_active ? "ايقاف" : "تفعيل"}</Tooltip>}
          >
            <i className={`ti ti-${row.is_active ? "check" : "close"} btn`}></i>
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
      <Seo title='المحاسبون' />

      <PageHeader title='المحاسبون' item='شركة وحيد' active_item='المحاسبون' />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto '>
                      المحاسبون
                      <button onClick={()=> forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                                               <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                    <Button
                      onClick={() => setAddAccountantPopup(true)}
                      className='btn btn-primary'
                    >
                      إنشاء محساب
                    </Button>
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
      {activatePopup && (
        <ActivatePopup
          loading={loading}
          setActivatePopup={setActivatePopup}
          userData={userData}
          activateUser={activateUser}
        />
      )}

      {addAccountantPopup && (
        <AddAccountantPopup
          setAddAccountantPopup={setAddAccountantPopup}
          addAccountant={addAccountant}
          loading={loading}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const AddAccountantPopup = ({
  setAddAccountantPopup,
  addAccountant,
  loading,
}) => {
  const [mobile, setMobile] = useState(null);
  const [email, setEmail] = useState(null);
  const [nationalId, setNationalId] = useState(null);
  const [name, setName] = useState(null);
  const [secret, setSecret] = useState(null);

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3>إنشاء محاسب جديد</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              addAccountant(e, {
                mobile,
                email,
                nationalId,
                name,
                secret,
              })
            }
          >
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل إسم المحاسب '
                name='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الجوال</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل جوال المحاسب '
                name='mobile'
                type='number'
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>البريد الالكتروني</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل البريد الالكتروني '
                name='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>رقم الهوية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل رقم هوية المحاسب '
                name='nationalId'
                type='number'
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>كلمة السر</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل كلمة السر '
                name='secret'
                type='text'
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </Form.Group>

            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإنشاء ..." : " إنشاء المحاسب"}
              </Button>
              <Button
                onClick={() => setAddAccountantPopup(false)}
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
