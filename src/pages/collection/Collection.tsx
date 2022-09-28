import 'bootstrap/dist/css/bootstrap.min.css';
import {Button} from 'reactstrap';
import {
  CardGroup,
  Col,
  Row,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardImg,
  CardText,
} from 'reactstrap';

export default function Collection() {
  return (
    <div className="container">
      <div className="row">
        <h1>Collection</h1>
        <p>
          Below are works selected by members for CineCapsule's permanent
          collection.
        </p>
      </div>
      <CardGroup>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658306891/1_s8nxnb.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #1
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/1"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658306987/2_k8fwyf.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #2
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/2"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658307072/3_lewwgm.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #3
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/3"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
      </CardGroup>
      <CardGroup>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658307155/4_ctypau.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #4
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/4"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658307204/5_pgmith.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #5
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/5"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://res.cloudinary.com/cinecapsule/image/upload/v1658307268/6_jdrusl.png"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              Cameras Cinecapsule #6
            </CardSubtitle>
            <CardText className="mb-2 text-muted">Art Blocks</CardText>
            <Button
              type="button"
              class="btn btn-info"
              href="https://testnets.opensea.io/assets/mumbai/0x8d5383b1fd33a1e78c4dfb23c4846bc7d038a246/6/"
              target="_blank">
              View details
            </Button>
          </CardBody>
        </Card>
      </CardGroup>
    </div>
  );
}
