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
        Below are works selected by members for ProdCapsule's permanent
        collection.
      </p>
      </div>
      <CardGroup>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
              Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
            Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
            Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
      </CardGroup>
      <CardGroup>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
              Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
            Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
        <Card>
          <CardImg
            alt="Card image cap"
            src="https://picsum.photos/318/180"
            top
            width="100%"
          />
          <CardBody>
            <CardTitle tag="h5">Card title</CardTitle>
            <CardSubtitle className="mb-2 text-muted" tag="h6">
              NFT Title
            </CardSubtitle>
            <CardText  className="mb-2 text-muted">
            Art Blocks
            </CardText>
            <Button>View details</Button>
          </CardBody>
        </Card>
      </CardGroup>
    </div>
  );
}

{
  /* <div className="interest_submit-proposal_xyz">
        <span
          className="interest_submit-proposal__image__1JcQq"
          aria-label="Unicorn emoji"
          role="img">
          🛠
        </span>
        <br></br>
        <div className="interest_submit-proposal__title__dZrRm">
        Page under construction
        </div>
        <div className="interest_submit-proposal-slogan">
        Back soon for a new collection of trendy NFTS.
        </div>
      </div> */
}
