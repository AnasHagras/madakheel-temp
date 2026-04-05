import Head from "next/head";
import {
  Button,
  Col,
  Form,
  Row,
  Alert,
  Container,
  Card,
} from "react-bootstrap";
import styles from "../../../styles/Home.module.scss";
import favicon from "../../../public/assets/img/brand/favicon.ico";
import { useEffect, useState } from "react";
// import Dashboard from "../pages/dashboard/dashboard/dashboard"

//Images
import logolight from "../../../public/assets/img/brand/oboorlogo-white.svg";

import { useRouter } from "next/router";


const Home = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [err, setError] = useState("")
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token')
    const response = await fetch(`${baseUrl}/api/v1/reset_password_confirm/`, {
      method: "POST",
      body: JSON.stringify({
        secret: password,
        token
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {

    });
    const data = await response.json();

    setLoading(false);
    console.log(data);
    data.success === true
      ? goToOtp(data?.data, password)
      :setError(data.message);
    setPassword("");

  };
  const goToOtp = () => {

    router.push("/dashboard/pages/login/")

  }

  return (
    <div className={styles.container}>
      <Head>
        <title>شركة وحيد</title>
        <meta name='description' content='شركة وحيد' />
        <link rel='icon' href={favicon.src} />
      </Head>
      <div className='page main-signin-wrapper'>
        <Row className='signpages text-center'>
          <Col md={12}>
            <Card>
              <Row className='row-sm'>
                <Col
                  lg={6}
                  xl={5}
                  className='d-none d-lg-block text-center bg-primary details'
                >
                  <div className='mt-4 p-2 pos-absolute'>
                    <img
                      src={logolight.src}
                      className='header-brand-img mb-4'
                      alt='logo-light'
                      height={100}
                    />
                    <div className='clearfix'></div>
                    {/* <img src={user.src} className='ht-100 mb-0' alt='user' /> */}
               
                    <h5 className='mt-4 text-white'>
                            ادخال كلمة السر الجديدة
                          </h5>
                    <span className='tx-white-6 tx-13 mb-5 mt-xl-0'>
                      بالرجاء ادخال كلمة السر الجديدة لتتمكن من تسجيل الدخول مرة أخري ومتابعة كل جديد 
                    </span>
                  </div>
                </Col>
                <Col lg={6} xl={7} xs={12} sm={12} className='login_form '>
                  <Container fluid>
                    <Row className='row-sm'>
                      <Card.Body className='mt-2 mb-2'>
                        {/* <img
                          src={logo.src}
                          className=' d-lg-none header-brand-img text-start float-start mb-4 auth-light-logo'
                          alt='logo'
                        /> */}
                        <img
                          src={logolight.src}
                          className=' d-lg-none header-brand-img text-start float-start mb-4 auth-dark-logo'
                          alt='logo'
                        />
                        <div className='clearfix'></div>
                        {err && <Alert variant='danger'>{err}</Alert>}
                        <Form onSubmit={(e) => handleSubmit(e)}>
                          <h5 className='text-start mb-2'>
                            ادخال كلمة السر الجديدة
                          </h5>

                          <Form.Group
                            className='text-start form-group'
                            controlId='formEmail'
                          >
                            <Form.Label> كمة السر الجديدة</Form.Label>
                            <Form.Control
                              className='form-control'
                              placeholder='ادخل كلمة السر الجديدة'
                              name='password'
                              type='text'
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </Form.Group>


                          <Button
                            disabled={loading}
                            type='submit'
                            className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                          >
                            {loading ? "جار  التحديث..." : `  تحديث كلمة السر`}
                          </Button>
                          {/* <div className="d-flex mt-2">
                            <p className='text-muted text-center tx-13'>
                              هل نسيت كلمة المرور ؟
                            </p>
                            <Link href='/dashboard/pages/forgot-password/'>استعادة كلمة المرور</Link>
                          </div> */}
                        </Form>
                        <div className='text-start mt-5 ms-0' />
                      </Card.Body>
                    </Row>
                  </Container>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};
Home.layout = "Authenticationlayout";

export default Home;
