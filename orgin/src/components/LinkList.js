import React, { Component } from 'react';
import Link from './Link';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
class LinkList extends Component {
    componentDidMount() {
      this._subscribeToNewLinks()
    }
	render() {
		if (this.props.feedQuery && this.props.feedQuery.loading) {
			return <div>Loading</div>;
		}

		// 2
		if (this.props.feedQuery && this.props.feedQuery.error) {
			return <div>Error</div>;
		}

		// 3
		const linksToRender = this.props.feedQuery.feed.links;
		console.log(this.props.feedQuery.feed.links);
		return (
			<div>
				{linksToRender.map((link, index) => (
					<Link key={link.id} updateStoreAfterVote={this._updateCacheAfterVote} index={index} link={link} />
				))}
			</div>
		);
	}

	_updateCacheAfterVote = (store, createVote, linkId) => {
		// 1
		const data = store.readQuery({ query: FEED_QUERY });

		// 2
		const votedLink = data.feed.links.find((link) => link.id === linkId);
		votedLink.votes = createVote.link.votes;

		// 3
		store.writeQuery({ query: FEED_QUERY, data });
	};

	_subscribeToNewLinks = () => {
		this.props.feedQuery.subscribeToMore({
			document: gql`
				subscription {
					newLink {
						node {
							id
							url
							description
							createdAt
							postedBy {
								id
								name
							}
							votes {
								id
								user {
									id
								}
							}
						}
					}
				}
			`,
updateQuery: (previous, { subscriptionData }) => {
  const newAllLinks = [subscriptionData.data.newLink.node, ...previous.feed.links]
  const result = {
    ...previous,
    feed: {
      links: newAllLinks
    },
  }
  return result
},
		});
  };
_subscribeToNewVotes = () => {
  this
    .props
    .feedQuery
    .subscribeToMore({
      document: gql `
      subscription {
        newVote {
          node {
            id
            link {
              id
              url
              description
              createdAt
              postedBy {
                id
                name
              }
              votes {
                id
                user {
                  id
                }
              }
            }
            user {
              id
            }
          }
        }
      }
    `,
      updateQuery: (previous, {subscriptionData}) => {
        console.log(`NEW VOTE`)
        const votedLinkIndex = previous
          .feed
          .links
          .findIndex(link => link.id === subscriptionData.data.newVote.node.link.id,)
        const newAllLinks = previous
          .feed
          .links
          .slice()
        const result = {
          ...previous,
          allLinks: newAllLinks
        }
        return result
      }
    })
}
}
export const FEED_QUERY = gql `
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      count
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`
export default graphql(FEED_QUERY, { name: 'feedQuery' })(LinkList);
