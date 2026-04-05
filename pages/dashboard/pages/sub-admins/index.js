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
  const { token, id, user_type } = user;
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [addAccountantPopup, setAddAccountantPopup] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isAddNew, setIsAddNew] = useState(true);
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('');
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };
  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'المشرفون'
      );
      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
      const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      setIsCanAdd(canAdd);
      setIsCanDelete(canDelete);
      setIsCanUpdate(canUpdate);
    }
  }, [user]);

  // const { token, id, user_type } = user;
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_accountant/?have_sales_permission=${selectedStatus}`, {
      headers: {

        Authorization: `${user.token}`,
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
  }, [update, selectedStatus]);

  const addAccountant = async (e, data) => {
    e.preventDefault();

    const { name, nationalId, mobile, secret, email, permissions, accountant_multiplier, country_code } = data;

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
        permissions,
        accountant_multiplier,
        country_code
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.token}`,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    if (res.ok && result.success) {
      toast.success("تم إنشاء المشرف بنجاح");
      setAddAccountantPopup(false);
      forceUpdate();
    } else {
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
  const updateAccountant = async (e, data) => {
    e.preventDefault();

    const { name, nationalId, mobile, secret, email, permissions, id, accountant_multiplier, country_code } = data;

    if (nationalId.length < 9) {
      toast.error("الهوية يجب أن تكون أكبر من 9 خانات");
      return;
    }
    if (mobile.length !== 9) {
      toast.error("الجوال يجب أن يكون 9 خانات");
      return;
    }

    setLoading(true);
    const res = await fetch(`${baseUrl}/api/v1/get_accountant/${id}/?have_sales_permission=`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        national_id: nationalId,
        mobile,
        secret,
        email,
        permissions,
        accountant_multiplier,
        country_code
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `${user.token}`,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    console.log('result', res)
    if (res.ok) {
      toast.success("تم تعديل المشرف بنجاح");
      setAddAccountantPopup(false);
      forceUpdate();
    } else {
      if (result.message?.mobile) toast.error(result.message.mobile[0]);
      if (result.message?.secret) toast.error(result.message.secret[0]);
      if (result.message?.national_id)
        toast.error(result.message?.national_id[0]);
      if (result.message?.email) toast.error(result.message.email[0]);
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
          href={``}
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
            if (user_type === "ADM" || isCanUpdate) {

              if (row.is_active) setSuspendPopup(true);
              else setActivatePopup(true);
              setUserData(row);
            }
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
    {
      name: "تعديل",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            if (user_type === "ADM" || isCanUpdate) {

              setIsAddNew(false)
              setAddAccountantPopup(true);
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
      <Seo title='المشرفون' />

      <PageHeader title='المشرفون' item='شركة وحيد' active_item='المشرفون' />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto '>
                      المشرفون
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                    <Form.Group className='text-start form-group  ' controlId='formPackage'>
                          <Form.Label> فرز عن طرق  الصلاحيات</Form.Label>
                          <Form.Select
                            className='form-control ps-5 text-muted'
                            name='categories'
                            value={selectedStatus} // Assuming you have state for the selected package
                            onChange={(e) => handleStatusChange(e)}
                            required
                          >
                            {/* Placeholder option */}

                            <option value=""> الكل...</option>
                            <option value="false">ليس لديه  صلاحيات  </option>
                            <option value="true">  لديه  صلاحيات</option>



                          </Form.Select>
                        </Form.Group>
                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                      <div>
                 
                      </div>

                      {
                        user_type === "ADM" || isCanAdd ?

                          <Button
                            onClick={() => {

                              setIsAddNew(true)
                              setAddAccountantPopup(true)
                            }}
                            className='btn btn-primary'
                          >
                            إنشاء مشرف
                          </Button>
                          : ''
                      }
                      <Button onClick={exportToExcel}>Export to Excel</Button>
                    </div>
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
          updateAccountant={updateAccountant}
          rowData={userData}
          isAddNew={isAddNew}
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
  updateAccountant,
  loading,
  isAddNew,
  rowData,
}) => {
  const [mobile, setMobile] = useState(isAddNew ? '' : rowData.mobile);
  const [email, setEmail] = useState(isAddNew ? '' : rowData.email);
  const [nationalId, setNationalId] = useState(isAddNew ? '' : rowData.national_id);
  const [name, setName] = useState(isAddNew ? '' : rowData.name);
  const [secret, setSecret] = useState(isAddNew ? '' : rowData.secret || '');
  const [accountantMultiplier, setAccountantMultiplier] = useState(isAddNew ? 1 : rowData.accountant_multiplier || 1);
  const [permissions, setPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(
    isAddNew ? [] : rowData.permissions.map((perm) => perm.id)
  );
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [countryCode, setCountryCode] = useState([]);
  const [selectedCode, setSelectedCode] = useState(isAddNew ? 1 : rowData.country_code || 1); // Default to Saudi Arabia
  useEffect(() => {


    const fetchCountryCode = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/country-code/`, {

        });
        const data = await res.json();
        console.log(data);

        setCountryCode(data);

      } catch (error) {
        console.error("Error fetching :", error);
      }
    };

    fetchCountryCode();
  }, []);
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_permissions/`, {
      headers: {
        Authorization: `${user.token}`,
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
      .then((data) => setPermissions(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const accountantData = {
      mobile,
      email,
      nationalId,
      name,
      secret,
      country_code: JSON.parse(selectedCode),
      permissions: selectedPermissions,
      accountant_multiplier: accountantMultiplier,
    };

    if (isAddNew) {
      addAccountant(e, accountantData);
    } else {
      updateAccountant(e, { ...accountantData, id: rowData.id });
    }
  };
  const getSavePermissionIdForCategory = (category) => {
    // Replace this logic with the actual way to get the "حفظ" permission ID for each category
    const savePermission = permissions[category].find(perm => perm.display_name === 'عرض');
    return savePermission ? savePermission.id : null;
  };

  const togglePermission = (category, id) => {
    const savePermissionId = getSavePermissionIdForCategory(category);
    const categoryPermissions = permissions[category].map((perm) => perm.id);

    setSelectedPermissions((prevSelected) => {
      let newSelected;

      // If "عرض" permission is toggled off, remove all permissions for the category
      if (id === savePermissionId) {
        newSelected = prevSelected.includes(id)
          ? prevSelected.filter((permId) => !categoryPermissions.includes(permId))
          : [...prevSelected, id];
      } else {
        // Toggle other permissions and ensure "عرض" is included
        newSelected = prevSelected.includes(id)
          ? prevSelected.filter((permId) => permId !== id)
          : [...prevSelected, id];

        // Always ensure "عرض" is included if any other permission in the category is selected
        if (savePermissionId && !newSelected.includes(savePermissionId)) {
          newSelected.push(savePermissionId);
        }
      }

      return newSelected;
    });
  };

  const toggleCategoryPermissions = (category) => {
    const categoryPermissions = permissions[category].map((perm) => perm.id);
    const savePermissionId = getSavePermissionIdForCategory(category);
    const allSelected = categoryPermissions.every((id) =>
      selectedPermissions.includes(id)
    );

    setSelectedPermissions((prevSelected) => {
      let newSelected;
      if (allSelected) {
        newSelected = prevSelected.filter((id) => !categoryPermissions.includes(id));
      } else {
        newSelected = [
          ...prevSelected,
          ...categoryPermissions.filter((id) => !prevSelected.includes(id)),
        ];

        // Ensure the "حفظ" permission for this category is always included
        if (savePermissionId && !newSelected.includes(savePermissionId)) {
          newSelected.push(savePermissionId);
        }
      }
      return newSelected;
    });
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px", overflow: "auto", height: "80vh" }}>
        <Card.Header>
          <h3>{isAddNew ? "إنشاء مشرف جديد" : "تعديل المشرف"}</h3>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Form fields */}
            <Form.Group className='text-start form-group'>
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل إسم المشرف '
                name='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group'>
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
                  className='form-control'
                  placeholder='ادخل جوال المشرف '
                  name='mobile'
                  type='number'
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>

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

            <Form.Group className='text-start form-group' controlId='formpassword'>
              <Form.Label>رقم الهوية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل رقم هوية المشرف '
                name='nationalId'
                type='number'
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formpassword'>
              <Form.Label>كلمة السر</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل كلمة السر '
                name='secret'
                type='text'
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required={isAddNew}
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='accountant_multiplier'>
              <Form.Label> مضاعف التوزيعات</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل  مضاعف التوزيعات '
                name='accountant_multiplier'
                type='number'
                value={accountantMultiplier}
                onChange={(e) => setAccountantMultiplier(e.target.value)}
                required
              />
            </Form.Group>

            {/* Permissions Section */}
            <Form.Group className="text-start form-group">
              <Form.Label>الصلاحيات</Form.Label>
              <Form.Label>رصاصي : الصلاحية غير ممنوجة , ملون : الصلاحية ممنوحة</Form.Label>
              <div>
                {Object.keys(permissions).map((category) => (
                  <div key={category} className="mb-3 d-flex">
                    <Button onClick={() => toggleCategoryPermissions(category)} className="border-0 font-weight-bold rounded-2 " style={{ width: '120px', background: '#d2d2d2', color: 'black' }}>{category}</Button>
                    <div className="d-flex gap-2 ms-2 flex-wrap">
                      {permissions[category].map((perm) => (
                        <Button
                          style={!selectedPermissions.includes(perm.id) ? { background: '#d2d2d2', color: 'black' } : { color: 'white' }}
                          key={perm.id}
                          variant={
                            selectedPermissions.includes(perm.id)
                              ? "primary"
                              : ""
                          }
                          onClick={() => togglePermission(category, perm.id)}
                        >
                          {perm.display_name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Form.Group>

            {/* Submit and Cancel Buttons */}
            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار المعالجة ..." : (isAddNew ? "إنشاء المشرف" : "تحديث المشرف")}
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

