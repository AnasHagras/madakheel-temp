import React, { useState } from "react";
import { Button, Card, Dropdown, Form, Nav } from "react-bootstrap";

import Cookies from "js-cookie";
import logout from "../../../utils/logout";
import { getUserCookies } from "../../../utils/getUserCookies";
import { toast } from "react-toastify";
const user = getUserCookies();
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const HeadDropDown = () => {
  const [changePassPopup, setChangePass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { token, id: adminId, user_type } = user;

  function Fullscreen() {
    if (
      (document.fullScreenElement && document.fullScreenElement === null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)
    ) {
      if (document.documentElement.requestFullScreen) {
        document.documentElement.requestFullScreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen(
          Element.ALLOW_KEYBOARD_INPUT,
        );
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  }
  const changePass =async (e, data) => {
    console.log('llllll');
    e.preventDefault();
    setLoading(true);

    const {  newPass, oldPass ,confirmNewPass } = data;

    const fd = new FormData();
    fd.append("new_password", newPass);
    fd.append("old_password", oldPass);
    fd.append("new_password_confirm", confirmNewPass);
   

    const res = await fetch( `${baseUrl}/api/v1/change-password/`, {
      method: "POST" ,
      body: fd,
      headers: {
        Authorization: ` ${token}`,
      },
    });

    const result = await res.json();

    if (res.ok  ) {
      toast.success(result.message || "تم الإضافة بنجاح");
     
      setChangePass(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);
    

  }
  const Darkmode = () => {
    document.querySelector("body").classList.toggle("dark-theme");
    document.querySelector("#myonoffswitch2").checked = true;
    if (document.body.classList.contains("dark-theme")) {
      localStorage.setItem("Spruhadark", true);
    } else {
      localStorage.removeItem("Spruhadark");
    }
  };

  return (
    <>
      <div className='d-flex order-lg-2 align-items-center ms-auto'>
        <Dropdown className='dropdown d-flex main-header-theme'>
          <Nav.Link
            className='nav-link icon layout-setting'
            onClick={() => Darkmode()}
          >
            <span className='dark-layout'>
              <i className='fe fe-sun header-icons'></i>
            </span>
            <span className='light-layout'>
              <i className='fe fe-moon header-icons'></i>
            </span>
          </Nav.Link>
        </Dropdown>

        <div className='d-md-flex'>
          <div className='nav-link icon full-screen-link' onClick={Fullscreen}>
            <i className='fe fe-maximize fullscreen-button fullscreen header-icons'></i>
            <i className='fe fe-minimize fullscreen-button exit-fullscreen header-icons'></i>
          </div>
        </div>
        <Dropdown className=' main-header-notification' onClick={logout}>
          <Dropdown.Toggle className='nav-link icon' variant='default'>
            <i className='fe fe-log-out header-icons'></i>
          </Dropdown.Toggle>
        </Dropdown>
        <Dropdown className=' main-header-notification '  onClick={() => setChangePass(true)}>
          <Dropdown.Toggle className='nav-link icon' variant='default'>
            <span className="fa-passwd-reset fa-stack " style={{fontSize:'11px'}} >
              <i style={{fontWeight:'normal'}} className="fa fa-undo fa-stack-2x "></i>
              <i style={{fontWeight:'normal'}} className="fa fa-lock fa-stack-1x "></i>
            </span>
          </Dropdown.Toggle>
        </Dropdown>
        {/* <Dropdown className=' main-header-notification' onClick={() => setChangePass(true)}>
          <Dropdown.Toggle className='nav-link ' variant='default'>
           
            <Button className="mt-2 mt-md-0" >
              تغيير كلمة السر
            </Button>

          </Dropdown.Toggle>
        </Dropdown> */}

      </div>
      {changePassPopup && (
        <AddProductPopup
          loading={loading}
          setChangePass={setChangePass}
          changePass={changePass}

        />
      )}
    </>
  );
};

export default HeadDropDown;
const AddProductPopup = ({ setChangePass, changePass }) => {
  const [oldPass, setOldPass] = useState();
  const [newPass, setNewPass] = useState();
  const [confirmNewPass, setConfirmNewPass] = useState();


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)", right: '0' }}
      className='pos-fixed top-50 left-0 right-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "100%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3>
            تغيير كلمة السر
          </h3>


        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              changePass(e, {
                oldPass,
                newPass,
                confirmNewPass

               

              })
            }
          >
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>كلمة السر القديمة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل كلمة السر القديمة'
                name='title'
                type='text'
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>كلمة السر الجديدة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل كلمة السر الجديدة'
                name='title'
                type='text'
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>تأكيد كلمة السر الجديدة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder=' تأكيد كلمة السر الجديدة'
                name='title'
                type='text'
                value={confirmNewPass}
                onChange={(e) => setConfirmNewPass(e.target.value)}
                required
              />
            </Form.Group>

            <div className='d-flex gap-4'>
              <Button
                // disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {/* {loading ? "جار الإضافة..." :  isAddNew ? "إضافة مدينة جديدة" : "تعديل"} */}
                حفظ
              </Button>
              <Button
                onClick={() => setChangePass(false)}
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
